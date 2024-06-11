import { setLibs } from '../../scripts/utils.js';

const miloLibs = setLibs('/libs');
const { createTag } = await import(`${miloLibs}/utils/utils.js`);

export default async function init(element) {
  await createTag();
  const content = Array.from(element.querySelectorAll(':scope > div'));
  const VERB = element.classList.value.replace('acom-converter', '');
  content.forEach((con) => con.classList.add('hide'));
  element.dataset.verb = VERB.trim();
  const wrapper = createTag('div', { class: 'acom-converter_wrapper' });
  const titleWrapper = createTag('div', { class: 'acom-converter_title-wrapper' });
  const titleImg = createTag('div', { class: 'acom-converter_title-img' });
  const title = createTag('div', { class: 'acom-converter_title' }, 'Adobe Acrobat');
  const heading = createTag('div', { class: 'acom-converter_heading' }, content[0].textContent);
  const dropZone = createTag('div', { class: 'acom-converter_dropzone' });
  const artwork = createTag('img', { class: 'acom-converter_artwork', src: `${content[1].querySelector('img').src}` });
  const copy = createTag('div', { class: 'acom-converter_copy' }, 'Select a Microsoft Word document (DOCX or DOC) to convert to PDF.');
  const cta = createTag('button', { class: 'hide', type: 'file', id: 'file-upload' });
  const ctaLabel = createTag('label', { for: 'file-upload', class: 'acom-converter_cta' }, content[3].textContent);

  const converterFooter = createTag('div', { class: 'acom-converter_footer' });
  const converterSecureIcon = createTag('i', { class: 'acom-converter_secure-icon' });
  const converterLegalWrapper = createTag('div', { class: 'acom-converter_legal-wrapper' });
  const converterLegalIcon = createTag('p', { class: 'acom-converter_legal_info-icon' }, 'Your files will be securely handled by Adobe servers and deleted unless you sign in to save them.');
  const converterLegal = createTag('p', { class: 'acom-converter_legal' }, 'By using this service, you agree to the Adobe Terms of Use and Privacy Policy.');

  // Consutruction of Widget
  titleWrapper.append(titleImg, title);
  wrapper.append(titleWrapper, heading, dropZone, converterFooter);
  dropZone.append(artwork, copy, ctaLabel, cta);
  converterFooter.append(converterSecureIcon, converterLegalWrapper);
  converterLegalWrapper.append(converterLegalIcon, converterLegal);
  element.append(wrapper);

  cta.addEventListener('change', (e) => {
    console.log(e);
  });
}
