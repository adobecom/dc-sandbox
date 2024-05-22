/* eslint-disable guard-for-in */
// https://console.cloud.google.com/apis/credentials?project=fircpoc
// Bucket - https://console.cloud.google.com/storage/browser/fric-poc;tab=objects?project=fircpoc&prefix=&forceOnObjectsSortingFiltering=false
// Personalization Ready Event

const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
const form = document.createElement('form');
form.id = 'theform';
const bucketName = 'fric-poc';
const clientID = '772441284722-r6ft7ltrikevn75dk4nbv2jsc8f1lpkh.apps.googleusercontent.com';
const redirectURL = 'http://localhost:3000/drafts/gunn/api';
const scope = ['https://www.googleapis.com/auth/devstorage.read_write'];
const accessToken = 'ya29.a0AXooCgtck9bTuqj2yE-WIYZRiNSKqYKeckilnfILuLRo8vE4BokrIn2Ynv0RmjGg8AXaXWzOH4zljoZcAG6WnXqMqXOEkFOcjzDexKeQg__VQbm8pxVJSb7SyA2xeVibR8SkMloDqoA7scPnxYb7bBMnwfQ4zUwRKC0aCgYKAXQSARISFQHGX2MiEURKvc9Nwvmpvu9NmONedQ0170';

let encodeFileName;
let percent = 0;
const createTag = function createTag(tag, attributes, html) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement
        || html instanceof SVGElement
        || html instanceof DocumentFragment) {
      el.append(html);
    } else if (Array.isArray(html)) {
      el.append(...html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
};

const handleDragOver = (e) => {
  e.preventDefault();
};

let loadDC;
if (!window.localStorage.limit) {
  window.localStorage.limit = 0;
}

const handleDrop = (e) => {
  // let datas;
  e.preventDefault();
  console.log(e.dataTransfer.files);
  if (e.dataTransfer.items) {
    [...e.dataTransfer.items].forEach((item, i) => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file.type != 'application/pdf') {
          alert('Please try a PDF');
          // return;
        } else {
          loadDC = true;
        }
        console.log(`KIND = file, file[${i}].name = ${file.name}`);
      }
    });
  } else {
    [...e.dataTransfer.files].forEach((file, i) => {
      if (file.type != 'application/pdf') {
        alert('Please try a PDF');
        // return
      } else {
        loadDC = true;
      }
      console.log(`file[${i}].name = ${file.name}`);
    });
  }
};

const getToken = () => {
  form.setAttribute('method', 'GET'); // Send as a GET request.
  form.setAttribute('action', oauth2Endpoint);

  const params = {
    client_id: clientID,
    redirect_uri: ['http://localhost:3000/'],
    response_type: 'token',
    scope: ['https://www.googleapis.com/auth/devstorage.read_write'],
    include_granted_scopes: 'true',
    state: 'pass-through value',
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const p in params) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
};

const upload = (pbw, pb) => {
  const file = document.getElementById('file-upload');
  const filename = file.value.split('\\').slice(-1)[0];
  console.log(filename);
  console.log(`File Name: ${JSON.stringify(filename)}`);
  encodeFileName = encodeURIComponent(filename);
  console.log(encodeFileName);
  const extension = filename.split('.').slice(-1)[0].toLocaleLowerCase();
  let contentType = null;

  // Progress Bar
  document.querySelector('.widget-button').insertAdjacentElement('afterend', pbw);
  document.querySelector('.widget-button').remove();
  pbw.appendChild(pb);
  const movepb = document.querySelector('.pBar');
  setInterval(() => {
    percent = percent + 10;
    movepb.style.width = `${percent}%`;
  }, 305);

  // Detect Content Type
  if (extension === 'png') {
    contentType = 'image/png';
  } else if (extension === 'jpg' || extension === 'jpeg') {
    contentType = 'image/jpeg';
  } else if (extension === 'svg') {
    contentType = 'image/svg+xml';
  } else if (extension === 'mpeg') {
    contentType = 'video/mpeg';
  } else if (extension === 'webm') {
    contentType = 'video/webm';
  } else {
    alert('This file is invalid?');
  }

  if (contentType) {
    const reader = new FileReader();
    reader.addEventListener('load', async (event) => {
      const bytes = event.target.result;
      const response = await fetch(
        `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
            Authorization: `Bearer ${accessToken}`,
          },
          body: bytes,
        },
      );
      window.localStorage.POClimit = 1;
      const result = await response.json();
      if (result.mediaLink) {
        // alert(
        //   `Success to upload ${filename}. You can access it to ${result.mediaLink}`
        // );
      } else {
        // alert(`Failed to upload ${filename}`);
      }
    });

    reader.readAsArrayBuffer(file.files[0]);
  }
};

export default function init(element) {
  // Create Fake Widget
  const content = element.querySelectorAll(':scope > div');

  Array.from(content).forEach((con) => {
    con.classList.add('hide');
  });
  element.classList.add('ready');
  const wrappernew = createTag('div', { id: 'CIDTWO', class: 'fsw widget-wrapper facade' });
  const wrapper = createTag('div', { id: 'CID', class: 'fsw widget-wrapper' });
  const heading = createTag('h1', { class: 'widget-heading' }, `${content[1].textContent}`);
  const dropZone = createTag('div', { id: 'dZone', class: 'widget-center' });
  const copy = createTag('p', { class: 'widget-copy' }, `${content[2].textContent}`);
  const button = createTag('input', { type: 'file', id: 'file-upload', class: 'hide' }, `${content[3].textContent}`);
  const buttonLabel = createTag('label', { for: 'file-upload', class: 'widget-button' }, `${content[3].textContent}`);
  const legal = createTag('p', { class: 'widget-legal' }, `${content[4].textContent}`);
  const subTitle = createTag('p', { class: 'widget-sub' }, 'Adobe Acrobat');
  const iconLogo = createTag('div', { class: 'widget-icon'});
  const iconSecurity = createTag('div', { class: 'security-icon' });
  const icon = createTag('div', { class: 'widget-big-icon' });
  const footer = createTag('div', { class: 'widget-footer' });
  const progressBarWrapper = createTag('div', { class: 'pBar-wrapper' });
  const progressBar = createTag('div', { class: 'pBar' });
  if (Number(window.localStorage.limit) > 1) {
    upsell.classList.remove('hide');
    wrapper.append(upsell);
    element.append(wrapper);
  } else {
    wrapper.append(subTitle);
    subTitle.prepend(iconLogo);
    wrapper.append(icon);

    wrapper.append(heading);
    // wrapper.append(dropZone);
    wrapper.append(copy);
    wrapper.append(button);
    wrapper.append(buttonLabel);
    // wrapper.parentNode.appendChild(footer);
    // wrapper.append(legal);
    footer.append(iconSecurity);
    footer.append(legal);
    element.append(wrapper);
    element.append(footer);
    element.append(wrappernew);
  }

  if (Number(window.localStorage.limit) === 1) {
    const secondConversion = createTag('p', { class: 'demo-text' }, 'Returning Visitor');
    heading.prepend(secondConversion);
  }

  dropZone.addEventListener('dragover', (file) => {
    handleDragOver(file);
    dropZone.classList.add('dragging');
  });
  dropZone.addEventListener('dragleave', (file) => {
    dropZone.classList.remove('dragging');
  });

  window.addEventListener('DC_Hosted:Ready', () => {
    window.dc_hosted.addEventListener((e) => {
      console.log(e);
      if (e === 'dropzone-displayed') {
        document.querySelector('#CIDTWO').id = 'CID'
      }
    });
  });

  dropZone.addEventListener('drop', (file) => {
    handleDrop(file);
    dropZone.classList.remove('dragging');
    // make call to dc web and pass over file
    if (loadDC) { window.localStorage.limit = 1 + Number(window.localStorage.limit); }
    upload();
  });

  button.addEventListener('click', (e) => {
    // getToken();
    // upload();
  });

  button.addEventListener('change', (e) => {
    upload(progressBarWrapper, progressBar);

    const selectedFile = document.getElementById('file-upload').files[0];
    console.log(selectedFile);
    if (loadDC) { window.localStorage.limit = 1 + Number(window.localStorage.limit); }
    setTimeout(() => {
      // window.location = `https://storage.cloud.google.com/fric-poc/${encodeFileName}`;
      window.location = `https://console.cloud.google.com/storage/browser/_details/fric-poc/${encodeFileName};tab=live_object?project=fircpoc`;
      localStorage.demo = true
    }, 3000);
    console.log(`https://storage.cloud.google.com/fric-poc/${encodeFileName.replace(/['"]+/g, '')}`);
  });

  document.querySelector('.widget-sub').addEventListener('click', (e) => {
    getToken();
  });
}
