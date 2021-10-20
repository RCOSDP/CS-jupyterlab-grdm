import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';
import { LabIcon } from '@jupyterlab/ui-components';
import { ToolbarButton } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { showDialog, Dialog } from '@jupyterlab/apputils';

import logo from './images/GRDM_logo_horizon.svg';

import { requestAPI } from './handler';

const DIALOG_TITLE = 'Sync to GakuNin RDM'

interface FilesAction {
  id: string;
  args: string[];
}

interface FilesLastResult {
  exit_code: number;
  stdout: string;
  stderr: string;
}

interface FilesResponse {
  syncing: boolean;
  action: FilesAction;
  last_result: FilesLastResult;
}

function formatShortWarnMessage(action: FilesAction) {
    if (action.id === 'no_content') {
      return 'No `result` directory';
    }
    if (action.id === 'not_directory') {
      return '`result` is not a directory';
    }
    if (action.id === 'empty_directory') {
      return '`result` has no files';
    }
    if (action.id === 'already_syncing') {
      return 'Already syncing';
    }
    return action.id;
}

function formatWarnMessage(action: FilesAction) {
    var message = formatShortWarnMessage(action);
    return message + ': ' + (action.args || []).join(', ');
}

async function reloadButtonState(button: ToolbarButton) {
  const resp = await requestAPI<FilesResponse>('files');
  if (!resp.syncing && resp.last_result && resp.last_result.exit_code != 0) {
    console.error('Sync error', resp.last_result);
    const message = 'Command failed';
    await showDialog({
      title: DIALOG_TITLE,
      body: `${message} ${resp.last_result.stderr}`,
      buttons: [Dialog.okButton()],
    });
    button.removeClass('rdm-binderhub-disabled');
    return resp;
  }
  if (!resp.syncing) {
    const message = 'Finished';
    await showDialog({
      title: DIALOG_TITLE,
      body: message,
      buttons: [Dialog.okButton()],
    });
    button.removeClass('rdm-binderhub-disabled');
    return resp;
  }
  setTimeout(() => reloadButtonState(button), 1000);
  return resp;
}

async function startSync(button: ToolbarButton) {
  const resp = await requestAPI<FilesResponse>('files?action=sync');
  const currentAction = resp.action;
  if (!resp.syncing && currentAction && currentAction.id !== 'started') {
    console.warn('Sync failed', currentAction);
    await showDialog({
      title: DIALOG_TITLE,
      body: formatWarnMessage(currentAction),
      buttons: [Dialog.okButton()],
    });
    return resp;
  }
  button.addClass('rdm-binderhub-disabled');
  console.log('Started');
  await reloadButtonState(button);
  return resp;
}

/**
 * Initialization data for the rdm-binderhub-jlabextension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'rdm-binderhub-jlabextension:plugin',
  autoStart: true,
  requires: [IFileBrowserFactory, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    translator: ITranslator,
  ) => {
    console.log('JupyterLab extension rdm-binderhub-jlabextension is activated! - 2');
    const trans = translator.load('jupyterlab');
    const { defaultBrowser: browser } = factory;

    // Add a launcher toolbar item.
    const sync = new ToolbarButton({
      onClick: () => {
        if (sync.hasClass('rdm-binderhub-disabled')) {
          return;
        }
        startSync(sync)
          .catch(reason => {
            console.error(
              `The rdm_binderhub_jlabextension server extension failed.\n${reason}`
            );
          });
      },
      tooltip: trans.__('Sync to GRDM'),
      label: trans.__(''),
      icon: new LabIcon({
        name: 'Sync to GRDM',
        svgstr: logo,
      }),
    });
    browser.toolbar.addItem('sync_to_grdm', sync);
  }
};

export default plugin;
