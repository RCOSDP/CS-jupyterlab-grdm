import React from 'react';

export function getNoGRDMMessage() {
  const url = 'https://support.rdm.nii.ac.jp/usermanual/50/';
  if (/^ja/i.test(navigator.language)) {
    return {
      title: 'GRDM連携環境で実行されていません',
      body: (
        <div>
          この環境はGRDM連携環境ではありません。
          <br />
          <a href={url} style={{ color: '#106ba3' }} target="_blank">
            GRDMと連携した環境
          </a>
          でこのExtensionを実行することで、Jupyter
          Notebookで作成したデータをGRDMに保存することができます。
        </div>
      )
    };
  }
  return {
    title: 'Not running in a GRDM linked environment',
    body: (
      <div>
        The current environment is not a GRDM linked environment.
        <br />
        By running this Extension in{' '}
        <a href={url} style={{ color: '#106ba3' }} target="_blank">
          an environment linked to GRDM
        </a>
        , data created by Jupyter Notebook can be stored to GRDM.
      </div>
    )
  };
}
