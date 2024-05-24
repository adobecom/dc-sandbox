const ENVS = {
  prod: 'https://pdfnow.adobe.io',
  stage: 'https://pdfnow-stage.adobe.io',
  dev: 'https://pdfnow-dev.adobe.io',
};

function getEnv() {
  const { host } = window.location;
  // eslint-disable-next-line compat/compat
  const PAGE_URL = new URL(window.location.href);
  const query = PAGE_URL.searchParams.get('env');

  if (query) return ENVS[query];
  if (host.includes('stage.adobe') || host.includes('corp.adobe') || host.includes('stage')) {
    return ENVS.stage;
  }
  if (host.includes('hlx.page') || host.includes('localhost') || host.includes('hlx.live')) {
    return ENVS.dev;
  }
  return ENVS.prod;
}

const baseApiUrl = getEnv();
const tokenEndpoint = `${baseApiUrl}/users/anonymous_token`;
const discoveryEndpoint = `${baseApiUrl}/discovery`;

let percent = 0;

const createTag = (tag, attributes, html) => {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement || html instanceof DocumentFragment) {
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

const handleDrop = (e) => {
  e.preventDefault();
  if (e.dataTransfer.items) {
    [...e.dataTransfer.items].forEach((item) => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (!file.type.includes('pdf') && !file.type.includes('image') && !file.type.includes('video')) {
          alert('Please try a PDF, Image, or Video file');
        } else {
          const loadDC = true;
        }
      }
    });
  } else {
    [...e.dataTransfer.files].forEach((file) => {
      if (!file.type.includes('pdf') && !file.type.includes('image') && !file.type.includes('video')) {
        alert('Please try a PDF, Image, or Video file');
      } else {
        const loadDC = true;
      }
    });
  }
};

const getExpiryTimestamp = () => {
  console.log('Getting expiry timestamp...');
  // Generate an expiry timestamp (e.g., 1 hour from now)
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  return expiry;
};

const getAdobeToken = async () => {
  try {
    console.log('Getting Adobe token...');
    // eslint-disable-next-line compat/compat
    const response = await fetch(tokenEndpoint, { method: 'POST' });
    const data = await response.json();
    console.log('Adobe token:', data);
    return data.access_token;
  } catch (error) {
    console.error('Error getting Adobe token:', error);
    throw error;
  }
};

const encodeBlobUrl = (blobUrl = {}) => {
  try {
    const encodedBlobUrl = btoa(JSON.stringify(blobUrl));
    console.log('Encoded Blob URL:', encodedBlobUrl);
    return encodedBlobUrl.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

async function getAssetMetadata(assetUri, accessToken) {
  const url = `${assetUri}`;
  const mode = 'no-cors';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: `application/vnd.adobe.dc+json;profile="${baseApiUrl}/schemas/asset_metadata_basic_v1.json"`,
  };

  try {
    // eslint-disable-next-line compat/compat
    const response = await fetch(url, { mode, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching asset metadata:', error);
    throw error;
  }
}

const uploadToAdobe = async (file, progressBarWrapper, progressBar) => {
  const filename = file.name;
  // const encodeFileName = encodeURIComponent(filename);
  const extension = filename.split('.').slice(-1)[0].toLowerCase();
  let contentType;

  switch (extension) {
    case 'png':
      contentType = 'image/png';
      break;
    case 'jpg':
    case 'jpeg':
      contentType = 'image/jpeg';
      break;
    case 'svg':
      contentType = 'image/svg+xml';
      break;
    case 'pdf':
      contentType = 'application/pdf';
      break;
    default:
      alert('This file is invalid');
      return;
  }

  // Progress Bar Setup
  document.querySelector('.widget-button').insertAdjacentElement('afterend', progressBarWrapper);
  document.querySelector('.widget-button').remove();
  progressBarWrapper.appendChild(progressBar);
  const movepb = document.querySelector('.pBar');
  const interval = setInterval(() => {
    percent += 10;
    movepb.style.width = `${percent}%`;
  }, 305);

  try {
    const accessToken = await getAdobeToken();
    const expiry = getExpiryTimestamp();

    // Step 1: Upload File
    const formData = new FormData();
    formData.append('parameters', new Blob([JSON.stringify({
      options: {
        ignore_content_type: true,
        name: filename,
      },

    })], { type: `application/vnd.adobe.dc+json;profile="${baseApiUrl}/schemas/asset_upload_parameters_v1.json"` }));
    formData.append('file', file, filename);

    const uploadEndpoint = `${baseApiUrl}/${getExpiryTimestamp()}/assets`;
    // eslint-disable-next-line compat/compat
    const uploadResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    const assetUri = uploadResult.uri;
    const autasset = `{$baseApiUrl}/assets/${uploadResult.uri.split('/').pop()}`;

    console.log('Upload completed. Asset URI:', uploadResult);

    // Step 2: Create PDF
    const createPdfEndpoint = `${baseApiUrl}/${getExpiryTimestamp()}/assets/createpdf`;
    // eslint-disable-next-line compat/compat
    const createPdfResponse = await fetch(createPdfEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': `application/vnd.adobe.dc+json;profile="${baseApiUrl}/schemas/createpdf_parameters_v1.json"`,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        asset_uri: assetUri,
        name: filename,
        persistence: 'transient',
      }),
    });

    if (!createPdfResponse.ok) {
      throw new Error(`Failed to create PDF: ${createPdfResponse.statusText}`);
    }

    const createPdfResult = await createPdfResponse.json();
    console.log('PDF creation completed:', createPdfResult);
    const jobUri = createPdfResult.job_uri;

    // Step 3: Check Job Status
    const checkJobStatus = async () => {
      // eslint-disable-next-line compat/compat
      const statusResponse = await fetch(`${baseApiUrl}/${getExpiryTimestamp()}/jobs/status?job_uri=${encodeURIComponent(jobUri)}`, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
      }

      const statusResult = await statusResponse.json();

      if (statusResult.status === 'done') {
        return statusResult;
      }

      if (statusResult.status === 'failed') {
        throw new Error('Job failed');
      }
      // eslint-disable-next-line compat/compat
      return new Promise((resolve) => {
        setTimeout(() => resolve(checkJobStatus()), statusResult.retry_interval || 2000);
      });
    };

    await checkJobStatus();

    // Usage example

    await getAssetMetadata(assetUri, accessToken)
      .then((data) => console.log('Asset metadata:', data))
      .catch((error) => console.error('Error:', error));

    // // // Step 4: Fetch Metadata

    // const metadataEndpoint = `${baseApiUrl}/${getExpiryTimestamp()}/assets/metadata?asset_uri=${encodeURIComponent(autasset)}`;
    // // eslint-disable-next-line compat/compat
    // const metadataResponse = await fetch(metadataEndpoint, {
    //   mode: 'no-cors',
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': `application/vnd.adobe.dc+json;profile="${baseApiUrl}/schemas/asset_metadata_basic_v1.json"`,
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });

    // if (!metadataResponse.ok) {
    //   throw new Error(`Failed to fetch metadata: ${metadataResponse.statusText}`);
    // }

    // const metadataResult = await metadataResponse.json();
    // console.log('Upload and conversion completed. Metadata:', metadataResult);

    // Step 5: Fetch Download URI
    // const downloadUriEndpoint = `${baseApiUrl}/${getExpiryTimestamp()}/assets/download_uri?asset_uri=${encodeURIComponent(assetUri)}&make_direct_storage_uri=true&action=system`;
    // // eslint-disable-next-line compat/compat
    // const downloadUriResponse = await fetch(downloadUriEndpoint, {
    //   mode: 'no-cors',
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': `application/vnd.adobe.dc+json;profile="${baseApiUrl}/schemas/asset_uri_download_v1.json";charset=UTF-8"`,
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });

    // if (!downloadUriResponse.ok) {
    //   throw new Error(`Failed to fetch download URI: ${downloadUriResponse.statusText}`);
    // }

    // const downloadUriResult = await downloadUriResponse.json();
    // const downloadUri = downloadUriResult.uri;
    // console.log('Download URI:', downloadUri);

    // Step 6: Generate Blob URL and Display PDF
    const blobUrlStructure = {
      source: 'signed-uri',
      itemName: filename,
      itemType: 'application/pdf',
    };

    const encodedBlobUrl = encodeBlobUrl(blobUrlStructure);
    const blobViewerUrl = `https://acrobat.adobe.com/blob/${encodedBlobUrl}?defaultRHPFeature=verb-quanda&x_api_client_location=chat_pdf&pdfNowAssetUri=${encodeURIComponent(assetUri)}`;
    console.log(`<a href="${blobViewerUrl}" target="_blank">View PDF</a>`);
    window.location = ${blobViewerUrl}
  } catch (error) {
    console.error('Error during upload:', error);
    alert('An error occurred during the upload process. Please try again later.');
  } finally {
    clearInterval(interval);
  }
};

const upload = (pbw, pb) => {
  const file = document.getElementById('file-upload').files[0];
  if (file) {
    uploadToAdobe(file, pbw, pb);
  }
};

export default function init(element) {
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
  const button = createTag('input', { type: 'file', id: 'file-upload', class: 'hide' });
  const buttonLabel = createTag('label', { for: 'file-upload', class: 'widget-button' }, `${content[3].textContent}`);
  const legal = createTag('p', { class: 'widget-legal' }, `${content[4].textContent}`);
  const subTitle = createTag('p', { class: 'widget-sub' }, 'Adobe Acrobat');
  const iconLogo = createTag('div', { class: 'widget-icon' });
  const iconSecurity = createTag('div', { class: 'security-icon' });
  const icon = createTag('div', { class: 'widget-big-icon' });
  const footer = createTag('div', { class: 'widget-footer' });
  const progressBarWrapper = createTag('div', { class: 'pBar-wrapper' });
  const progressBar = createTag('div', { class: 'pBar' });

  wrapper.append(subTitle);
  subTitle.prepend(iconLogo);
  wrapper.append(icon);
  wrapper.append(heading);
  wrapper.append(copy);
  wrapper.append(button);
  wrapper.append(buttonLabel);
  footer.append(iconSecurity);
  footer.append(legal);
  element.append(wrapper);
  element.append(footer);
  element.append(wrappernew);

  if (Number(window.localStorage.limit) > 1) {
    const upsell = createTag('div', { class: 'upsell' }, 'You have reached your limit. Please upgrade.');
    wrapper.append(upsell);
    element.append(wrapper);
  }

  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('drop', handleDrop);

  document.getElementById('file-upload').addEventListener('change', (e) => {
    upload(progressBarWrapper, progressBar);
  });
}
