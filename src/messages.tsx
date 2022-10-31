import React from 'react';
import { TranslationBundle } from '@jupyterlab/translation';

export function getNoGRDMMessage(trans: TranslationBundle) {
  const title = trans.__('Not running in a GakuNin RDM linked environment');
  const descLang = trans.__('NoRDMMessageLang');
  const url = 'https://support.rdm.nii.ac.jp/usermanual/50/';
  if (descLang === 'ja') {
    // To return JSX Element, checking language as NoRDMMessageLang
    return {
      title,
      body: (
        <div>
          この環境はGakuNin RDM連携環境ではありません。
          <br />
          <a href={url} style={{ color: '#106ba3' }} target="_blank">
            GakuNin RDMと連携した環境
          </a>
          でこのExtensionを実行することで、Jupyter
          Notebookで作成したデータをGakuNin RDMに保存することができます。
        </div>
      )
    };
  }
  return {
    title,
    body: (
      <div>
        The current environment is not a GakuNin RDM linked environment.
        <br />
        By running this Extension in{' '}
        <a href={url} style={{ color: '#106ba3' }} target="_blank">
          an environment linked to GakuNin RDM
        </a>
        , data created by Jupyter Notebook can be stored to GakuNin RDM.
      </div>
    )
  };
}
