import iconUrl from './assets/images/copy-url.svg'
import iconTag from './assets/images/copy-tag.svg'
import './assets/css/unpkg.css'

function isFileTr(tr: Element) {
  const sizeNode = tr.childNodes[2]
  const { textContent } = sizeNode
  return textContent !== '' && textContent !== '-'
}

function isExtension(path: string | undefined | null, extension: string | string[]) {
  if (!path) {
    return false
  }
  if (typeof extension === 'string') {
    return path?.lastIndexOf(extension) === path.length - extension.length
  }
  return extension.some(c => path?.lastIndexOf(c) !== -1)
}

function createImg(src: string, title: string, clickFun: (this: GlobalEventHandlers, ev: MouseEvent) => any) {
  const imgElement = document.createElement('img')
  imgElement.src = src
  imgElement.className = 'unpkg-copy-img'
  imgElement.title = title
  imgElement.addEventListener('click', clickFun)
  return imgElement
}

function createA(title: string, className: string, clickFun: (this: GlobalEventHandlers, ev: MouseEvent) => any) {
  const insertTag = document.createElement('a')
  insertTag.innerHTML = title
  insertTag.href = 'javascript:void(0)'
  insertTag.onclick = clickFun
  insertTag.className = className
  return insertTag
}

function genClickFun(path: string, extension?: string) {
  return () => {
    let text = path.replace('/browse/', '/')
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
  const fileChild = tr.children[1]
  const aElement = fileChild.firstElementChild
  const aHtml = aElement?.innerHTML
  let path = location.href + aHtml
  const urlImgElement = createImg(iconUrl, 'copy url', genClickFun(path))
  td.append(urlImgElement)
  if (isExtension(aHtml, 'js')) {
    // copy script tag
    const scriptTagImgElement = createImg(iconTag, 'copy script tag', genClickFun(path, 'script'))
    td.append(scriptTagImgElement)
  } else if (isExtension(aHtml, 'css')) {
    // copy link tag
    const scriptTagImgElement = createImg(iconTag, 'copy link tag', genClickFun(path, 'link'))
    td.append(scriptTagImgElement)
  }
  tr.append(td)
}
async function main() {
  console.log('main')
  const aTag = document.querySelector('a[href="' + location.pathname.replace('/browse', '') + '"]')
  if (aTag) {
    const urlA = createA('copy url', aTag.className, genClickFun(location.href))
    aTag.parentElement?.insertBefore(urlA, aTag)
    if (isExtension(location.href, 'js')) {
      // copy script tag
      const scriptA = createA('copy script tag', aTag.className, genClickFun(location.href, 'script'))
      aTag.parentElement?.insertBefore(scriptA, aTag)
    } else if (isExtension(location.href, 'css')) {
      // copy link tag
      const linkA = createA('copy link tag', aTag.className, genClickFun(location.href, 'link'))
      aTag.parentElement?.insertBefore(linkA, aTag)
    }
  } else {
    const trList = document.querySelectorAll('table tbody tr')
    trList.forEach(insertAction)
  }
}

main()
