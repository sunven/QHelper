async function insertVSCodeButton() {
  // .btn.d-none.d-md-block 取go to file按钮
  // span.d-none.d-md-flex 去code按钮
  // let insertNode = document.querySelector('.btn.d-none.d-md-block') || document.querySelector('span.d-none.d-md-flex');
  let insertNode = document.querySelector('.Header-item.mr-0.mr-md-3.flex-order-1.flex-md-order-none');
  if (!insertNode) {
    return;
  }
  const arr = window.location.pathname.split('/');
  if (arr.length < 3) {
    return;
  }
  const target = `https://vscode.dev/github/${arr[1]}/${arr[2]}`;
  const layoutClass = insertNode.classList.contains('ml-2') ? 'ml-2' : 'mr-2';
  const btn = `<a style="background-color: rgb(45, 164, 78);color: white;" class="btn ${layoutClass} d-none d-md-block" target="_blank" href="${target}"> vscode.dev </a>`;
  insertNode.insertAdjacentHTML('beforebegin', btn);
}

insertVSCodeButton();
