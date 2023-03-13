import frictionless from '../../scripts/frictionless.js';
import { redirectLegacyBrowsers } from '../../scripts/legacyBrowser.js';

const pageLang = document.querySelector('html').lang;
const verbToRedirectLinkSuffix =  {
  'createpdf': 'createpdf',
  'crop-pages': 'crop',
  'delete-pages': 'deletepages',
  'extract-pages': 'extract',
  'combine-pdf': 'combine',
  'protect-pdf': 'protect',
  'add-comment': 'addcomment',
  'pdf-to-image': 'pdftoimage',
  'reorder-pages': 'reorderpages',
  'sendforsignature': 'sendforsignature',
  'rotate-pages': 'rotatepages',
  'fillsign': 'fillsign',
  'split-pdf': 'split',
  'insert-pdf': 'insert',
  'compress-pdf': 'compress',
};
export default function init(element) {
  const widget = element;
  let WIDGET_ENV = 'https://dev.acrobat.adobe.com/dc-hosted/2.39.1_1.170.2/dc-app-launcher.js';
  let ENV = 'dev';
  let REDIRECT_URL = '';
  let DC_GENERATE_CACHE_URL = '';

  if (window.location.hostname === 'main--dc--adobecom.hlx.live'
    || window.location.hostname === 'www.adobe.com') {
    WIDGET_ENV = 'https://documentcloud.adobe.com/dc-hosted/2.39.1_1.170.2/dc-app-launcher.js';
    ENV = 'prod';
  }

  if (window.location.hostname === 'stage--dc--adobecom.hlx.page'
    || window.location.hostname === 'main--dc--adobecom.hlx.page'
    || window.location.hostname === 'www.stage.adobe.com' ) {
    WIDGET_ENV = 'https://stage.acrobat.adobe.com/dc-hosted/2.39.1_1.170.2/dc-app-launcher.js';
    ENV = 'stage';
  }

  widget.querySelector('div').id = 'VERB';
  const VERB = widget.querySelector('div').innerText.trim().toLowerCase();

  // Redir URL
  if (widget.querySelectorAll('div')[2]) {
    widget.querySelectorAll('div')[2].id = 'REDIRECT_URL';
    widget.querySelectorAll('div')[2].classList.add('hide');
    REDIRECT_URL = widget.querySelectorAll('div')[2].innerText.trim().toLowerCase();
    console.log(REDIRECT_URL);
  }

  // Generate cache url
  if (widget.querySelectorAll('div')[4]) {
    widget.querySelectorAll('div')[4].id = 'GENERATE_CACHE_URL';
    widget.querySelectorAll('div')[4].classList.add('hide');
    DC_GENERATE_CACHE_URL = widget.querySelectorAll('div')[4].innerText.trim().toLowerCase();
  }

  // Redirect
  console.log('dinamic', `https://www.adobe.com/go/acrobat-${verbToRedirectLinkSuffix[VERB] || VERB.split('-').join('')}-${ENV}`);
  const fallBack = 'https://www.adobe.com/go/acrobat-overview';
  const redDir = () => {
    if (window.adobeIMS.isSignedInUser()) {
      if (window.location.hostname != 'main--dc--adobecom.hlx.live'
        && window.location.hostname != 'www.adobe.com' ) {
        window.location = `https://www.adobe.com/go/acrobat-${verbToRedirectLinkSuffix[VERB] || VERB.split('-').join('')}-${ENV}`|| REDIRECT_URL;
      } else {
        window.location = REDIRECT_URL || `https://www.adobe.com/go/acrobat-${verbToRedirectLinkSuffix[VERB] || VERB.split('-').join('')}` || fallBack;
      }
    }
  };

  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'CID';
  widgetContainer.className = 'dc-wrapper';
  widget.appendChild(widgetContainer);

  const isReturningUser = window.localStorage.getItem('pdfnow.auth');
  const isRedirection = /redirect_(?:conversion|files)=true/.test(window.location.search);
  const preRenderDropZone = !isReturningUser && !isRedirection;
  if (preRenderDropZone) {
    (async () => {
      // TODO: Make dynamic
      const response = await fetch(DC_GENERATE_CACHE_URL || `https://documentcloud.adobe.com/dc-generate-cache/dc-hosted-1.170.2/${VERB}-${pageLang.toLocaleLowerCase()}.html`);
      switch (response.status) {
        case 200: {
          const template = await response.text();
          const doc = new DOMParser().parseFromString(template, 'text/html');
          document.head.appendChild(doc.head.getElementsByTagName('Style')[0]);
          widgetContainer.appendChild(doc.body.firstElementChild);
          performance.mark("milo-insert-snippet");
          break;
        }
        default:
          break;
      }
    })();
  }

  window.addEventListener('IMS:Ready', () => {
    // Redirect Usage
    redDir();
    frictionless(VERB);
  });

  const dcScript = document.createElement('script');
  dcScript.id = 'adobe_dc_sdk_launcher';
  dcScript.setAttribute('src', WIDGET_ENV);
  dcScript.dataset.dropzone_id = 'CID';
  dcScript.dataset.locale = pageLang;
  dcScript.dataset.server_env = ENV;
  dcScript.dataset.verb = VERB;
  dcScript.dataset.load_typekit = 'false';
  dcScript.dataset.load_imslib = 'false';
  dcScript.dataset.enable_unload_prompt = 'true';
  if (preRenderDropZone) {
    dcScript.dataset.pre_rendered = 'true';
  }

  window.addEventListener('Bowser:Ready', ()=> {
    // EOL Redirect
    redirectLegacyBrowsers();
  })

  widget.appendChild(dcScript);

  window.addEventListener('IMS:Ready', () => {
    let evt;
    evt = new CustomEvent('dc.imslib.ready', { detail: { instance: window.adobeIMS }});
    evt.initEvent('dc.imslib.ready', true, true);
    document.dispatchEvent(evt);
    // window.adobe_dc_sdk.imsReady = true;
  })

  // DC Personalization
  window.addEventListener('DC_Hosted:Ready', () => {
    const DATA = window.dc_hosted.getUserLimits();
    DATA.then((val) => {
      const doccloudPersonalization = val;
      // if limit for 300 uploads is reached, limit is shared across all verbs,
      // upsell is shown for all verbs
      const canNotUpload = val.upload && !val.upload.can_upload;
      doccloudPersonalization.isUpsellDisplayed = {
        // L2 VERBS
        // convert-pdf, word-pdf, excel-pdf, jpg-pdf, ppt-pdf
        createPDF: canNotUpload || (val.create_pdf && !val.create_pdf.can_process),
        // pdf-word, pdf-excel, pdf-ppt, pdf-jpg (2 conversion allowed, limit is shared across them)
        exportPDF: canNotUpload || (val.export_pdf && !val.export_pdf.can_process),
        // compress-pdf
        compressPDF: canNotUpload || (val.compress_pdf && !val.compress_pdf.can_process),
        // password-protect
        passwordProtectPDF: canNotUpload || (val.protect_pdf && !val.protect_pdf.can_process),
        // merge-pdf
        mergePDF: canNotUpload || (val.combine_pdf && !val.combine_pdf.can_process),
        // L1 VERBS (all of them: request signature, pdf editor, delete pdf pages,
        // rotate pdf, rearrange pdf, split pdf, add pages to pdf, sign pdf, export pdf)
        l1Verbs: canNotUpload,
      };
      window.doccloudPersonalization = doccloudPersonalization;
      // Personalization Ready Event
      const personalizationIsReady = new CustomEvent('Personalization:Ready');

      window.dispatchEvent(personalizationIsReady);
    });
  });
}
