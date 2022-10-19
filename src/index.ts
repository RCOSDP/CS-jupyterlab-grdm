import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { LabIcon } from '@jupyterlab/ui-components';
import { ToolbarButton } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { showDialog, Dialog } from '@jupyterlab/apputils';

import logo from './images/GRDM_logo_horizon.svg';

import { requestAPI } from './handler';
import { getNoGRDMMessage } from './messages';

const DIALOG_TITLE = 'Sync to GakuNin RDM';

interface IFilesAction {
  id: string;
  args: string[];
}

interface IFilesLastResult {
  exit_code: number;
  stdout: string;
  stderr: string;
}

interface IFilesResponse {
  to_dir: string | null;
  syncing: boolean;
  action: IFilesAction;
  last_result: IFilesLastResult;
}

function formatShortWarnMessage(action: IFilesAction) {
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

function formatWarnMessage(action: IFilesAction) {
  const message = formatShortWarnMessage(action);
  return message + ': ' + (action.args || []).join(', ');
}

function formatErrorMessage(error: Error) {
  return `The request to the server failed: ${error}`;
}

async function reloadButtonState(button: ToolbarButton) {
  const resp = await requestAPI<IFilesResponse>('files');
  if (!resp.syncing && resp.last_result && resp.last_result.exit_code !== 0) {
    console.error('Sync error', resp.last_result);
    const message = 'Command failed';
    await showDialog({
      title: DIALOG_TITLE,
      body: `${message} ${resp.last_result.stderr}`,
      buttons: [Dialog.okButton()]
    });
    button.removeClass('rdm-binderhub-disabled');
    return resp;
  }
  if (!resp.syncing) {
    const message = 'Finished';
    await showDialog({
      title: DIALOG_TITLE,
      body: message,
      buttons: [Dialog.okButton()]
    });
    button.removeClass('rdm-binderhub-disabled');
    return resp;
  }
  setTimeout(() => reloadButtonState(button), 1000);
  return resp;
}

async function performSync(button: ToolbarButton) {
  const resp = await requestAPI<IFilesResponse>('files?action=sync');
  const currentAction = resp.action;
  if (!resp.syncing && currentAction && currentAction.id !== 'started') {
    console.warn('Sync failed', currentAction);
    await showDialog({
      title: DIALOG_TITLE,
      body: formatWarnMessage(currentAction),
      buttons: [Dialog.okButton()]
    });
    return resp;
  }
  button.addClass('rdm-binderhub-disabled');
  console.log('Started');
  await reloadButtonState(button);
  return resp;
}

async function startSync(button: ToolbarButton) {
  try {
    return await performSync(button);
  } catch (error) {
    await showDialog({
      title: DIALOG_TITLE,
      body: formatErrorMessage(error),
      buttons: [Dialog.okButton()]
    });
    throw error;
  }
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
    translator: ITranslator
  ) => {
    console.log(
      'JupyterLab extension rdm-binderhub-jlabextension is activated! - 2'
    );
    const trans = translator.load('rdm_binderhub_jlabextension');
    const title = trans.__('Sync to RDM');
    console.log('TranslatorBundle', title, trans);
    const { defaultBrowser: browser } = factory;

    // Add a launcher toolbar item.
    const sync = new ToolbarButton({
      onClick: () => {
        if (sync.hasClass('rdm-binderhub-disabled')) {
          return;
        }
        if (sync.hasClass('rdm-binderhub-no-grdm')) {
          const { title, body } = getNoGRDMMessage(trans);
          showDialog({
            title: title,
            body: body,
            buttons: [Dialog.okButton()]
          }).catch(reason => {
            console.error(
              `The rdm_binderhub_jlabextension server extension failed.\n${reason}`
            );
          });
          return;
        }
        startSync(sync).catch(reason => {
          console.error(
            `The rdm_binderhub_jlabextension server extension failed.\n${reason}`
          );
        });
      },
      tooltip: title,
      label: trans.__(''),
      icon: new LabIcon({
        name: title,
        svgstr: logo
      })
    });
    sync.addClass('rdm-binderhub-disabled');
    sync.addClass('rdm-binderhub-no-grdm');
    requestAPI<IFilesResponse>('files').then(data => {
      console.log('Loaded', data);
      sync.removeClass('rdm-binderhub-disabled');
      if (!data.to_dir) {
        return;
      }
      sync.removeClass('rdm-binderhub-no-grdm');
    });
    browser.toolbar.addItem('sync_to_grdm', sync);
  }
};

export default plugin;
