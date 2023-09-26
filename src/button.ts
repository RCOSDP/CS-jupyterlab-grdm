import { LabIcon } from '@jupyterlab/ui-components';
import { ToolbarButton } from '@jupyterlab/apputils';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';

import logo from './images/GRDM_logo_horizon.svg';

import { requestAPI } from './handler';
import { getNoGRDMMessage } from './messages';


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
  syncing: boolean;
  action: IFilesAction;
  to_dir?: string | null;
  last_result: IFilesLastResult;
}

function formatShortWarnMessage(trans: TranslationBundle, action: IFilesAction) {
  if (action.id === 'no_content') {
    return trans.__('No `result` directory');
  }
  if (action.id === 'not_directory') {
    return trans.__('`result` is not a directory');
  }
  if (action.id === 'empty_directory') {
    return trans.__('`result` has no files');
  }
  if (action.id === 'already_syncing') {
    return trans.__('Already syncing');
  }
  return action.id;
}

function formatWarnMessage(trans: TranslationBundle, action: IFilesAction) {
  const message = formatShortWarnMessage(trans, action);
  return message + ': ' + (action.args || []).join(', ');
}

async function reloadButtonState(trans: TranslationBundle, button: ToolbarButton | null) {
  const resp = await requestAPI<IFilesResponse>('files');
  const title = trans.__('Sync to GakuNin RDM');
  if (!resp.syncing && resp.last_result && resp.last_result.exit_code !== 0) {
    console.error('Sync error', resp.last_result);
    const message = 'Command failed';
    await showDialog({
      title,
      body: `${message} ${resp.last_result.stderr}`,
      buttons: [Dialog.okButton()]
    });
    button?.removeClass('rdm-binderhub-disabled');
    return resp;
  }
  if (!resp.syncing) {
    const message = 'Finished';
    await showDialog({
      title,
      body: message,
      buttons: [Dialog.okButton()]
    });
    button?.removeClass('rdm-binderhub-disabled');
    return resp;
  }
  setTimeout(() => reloadButtonState(trans, button), 1000);
  return resp;
}

async function startSync(trans: TranslationBundle, button: ToolbarButton | null) {
  const resp = await requestAPI<IFilesResponse>('files?action=sync');
  if (!resp.to_dir) {
    const { title, body } = getNoGRDMMessage(trans);
    await showDialog({
      title,
      body,
      buttons: [Dialog.okButton()]
    });
    return;
  }
  const title = trans.__('Sync to GakuNin RDM');
  const currentAction = resp.action;
  if (!resp.syncing && currentAction && currentAction.id !== 'started') {
    console.warn('Sync failed', currentAction);
    await showDialog({
      title,
      body: formatWarnMessage(trans, currentAction),
      buttons: [Dialog.okButton()]
    });
    return resp;
  }
  button?.addClass('rdm-binderhub-disabled');
  console.log('Started');
  await reloadButtonState(trans, button);
  return resp;
}

export function addSyncMenu(trans: TranslationBundle, commands: CommandRegistry) {
  commands.addCommand('rdm-binderhub-jlabextension:sync-to-grdm-menu', {
    execute: () => {
      startSync(trans, null).catch(reason => {
        console.error(
          `The rdm_binderhub_jlabextension server extension failed.\n${reason}`
        );
      });
    },
    //iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: trans.__('Sync to RDM'),
    icon: new LabIcon({
      name: 'Sync to RDM',
      svgstr: logo
    }),
  });
}

export function createSyncButton(trans: TranslationBundle): ToolbarButton {
  const sync = new ToolbarButton({
    onClick: () => {
      if (sync.hasClass('rdm-binderhub-disabled')) {
        return;
      }
      startSync(trans, sync).catch(reason => {
        console.error(
          `The rdm_binderhub_jlabextension server extension failed.\n${reason}`
        );
      });
    },
    tooltip: trans.__('Sync to RDM'),
    label: trans.__(''),
    icon: new LabIcon({
      name: 'Sync to RDM',
      svgstr: logo
    }),
  });
  return sync;
}
