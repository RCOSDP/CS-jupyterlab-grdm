import React from 'react';
import { TranslationBundle } from '@jupyterlab/translation';
import parse from 'html-react-parser';

export type DialogContent = {
  title: string;
  body: JSX.Element;
};

export function getNoGRDMMessage(trans: TranslationBundle): DialogContent {
  const title = trans.__('Not running in a GakuNin RDM linked environment');
  const url = 'https://support.rdm.nii.ac.jp/usermanual/50/';
  const html = trans.__(
    `
  <div>
    The current environment is not a GakuNin RDM linked environment.
    <br />
    By running this Extension in
    <a href="%1" style="color: #106ba3;" target="_blank">
      an environment linked to GakuNin RDM
    </a>
    , data created by Jupyter Notebook can be stored to GakuNin RDM.
  </div>
`,
    url
  );
  const content = parse(html);
  if (typeof content === 'string') {
    throw new Error(`Unexpected message type: ${content}`);
  }
  const body = <div>{content}</div>;
  return {
    title,
    body
  };
}
