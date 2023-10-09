import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Toolbar } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { ITranslator } from '@jupyterlab/translation';

import { createSyncButton, addSyncMenu } from './button';

function insertItemBefore(
  target: Toolbar<Widget>,
  name: string,
  item: Widget,
  originClassName: string,
  timeout: number
) {
  if (timeout < 0) {
    console.warn('Origin not found', originClassName);
    target.addItem(name, item);
    return;
  }
  const children = new Array(...target.children())
    .map((element, index) => ({
      element,
      index
    }))
    .filter(({ element }) => element.node.classList.contains(originClassName));
  if (children.length > 0) {
    const { index } = children[0];
    target.insertItem(index, name, item);
    return;
  }
  const nextTimeout = 100;
  setTimeout(() => {
    insertItemBefore(
      target,
      name,
      item,
      originClassName,
      timeout - nextTimeout
    );
  }, nextTimeout);
}

/**
 * Initialization data for the rdm-binderhub-jlabextension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'rdm-binderhub-jlabextension:plugin',
  description: 'JupyterLab extension for GakuNin RDM.',
  autoStart: true,
  requires: [IDefaultFileBrowser, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    browser: IDefaultFileBrowser,
    translator: ITranslator
  ) => {
    console.log(
      'JupyterLab extension rdm-binderhub-jlabextension is activated!'
    );
    const trans = translator.load('rdm_binderhub_jlabextension');
    const sync = createSyncButton(trans);
    /* "Sync to GRDM" button is placed to the left of the filter text box */
    insertItemBefore(
      browser.toolbar,
      'rdm-binderhub-jlabextension:sync-to-grdm-button',
      sync,
      'jp-FileBrowser-filterBox',
      1000 /*timeout*/
    );
    addSyncMenu(trans, app.commands);
  }
};

export default plugin;
