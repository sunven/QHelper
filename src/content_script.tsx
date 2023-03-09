import iconUrl from './assets/images/copy-url.svg'
import iconTag from './assets/images/copy-tag.svg'
import './assets/css/unpkg.css'

function isFileTr(tr: Element) {
  const sizeNode = tr.childNodes[2]
  const { textContent } = sizeNode
  return textContent !== '' && textContent !== '-'
}

function isExtension(tr: Element, extension: string | string[]) {
  const fileNameNode = tr.childNodes[1]
  const { textContent } = fileNameNode
  if (typeof extension === 'string') {
    return textContent?.lastIndexOf(extension) !== -1
  }
  return extension.some(c => textContent?.lastIndexOf(c) !== -1)
}

function createImg(src: string, title: string, clickFun: (this: GlobalEventHandlers, ev: MouseEvent) => any) {
  const imgElement = document.createElement('img')
  imgElement.src = src
  imgElement.className = 'unpkg-copy-img'
  imgElement.title = title
  imgElement.addEventListener('click', clickFun)
  return imgElement
}

function genClickFun(tr: Element, extension?: string) {
  return () => {
    const fileChild = tr.children[1]
    const aElement = fileChild.firstElementChild
    let text = location.href + aElement?.innerHTML
    text = text.replace('/browse/', '/')
    if (extension === 'script') {
      text = `<script src="${text}"></script>`
    } else if (extension === 'link') {
      text = `<link rel="stylesheet" href="${text}" />`
    }
    navigator.clipboard.writeText(text)
  }
}

function insertAction(tr: Element) {
  if (!isFileTr(tr)) {
    return
  }
  const td = document.createElement('td')
  td.className = 'unpkg-copy-td'
  td.style.borderTop = '1px solid #eaecef'
  // copy url
  const urlImgElement = createImg(iconUrl, 'copy url', genClickFun(tr))
  td.append(urlImgElement)
  if (isExtension(tr, '.js')) {
    // copy script tag
    const scriptTagImgElement = createImg(iconTag, 'copy script tag', genClickFun(tr, 'script'))
    td.append(scriptTagImgElement)
  } else if (isExtension(tr, 'css')) {
    // copy link tag
    const scriptTagImgElement = createImg(iconTag, 'copy link tag', genClickFun(tr, 'link'))
    td.append(scriptTagImgElement)
  }
  tr.append(td)
}
async function main() {
  console.log('main')
  const trList = document.querySelectorAll('table tbody tr')
  trList.forEach(insertAction)
}

main()
