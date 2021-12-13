const uploadInput = document.getElementById('uploadInput');
uploadInput.addEventListener('change', event => {
  const files = Array.from(event.target.files);
  const promiseArr = readImages(files);
  Promise.all(promiseArr).then(images => {
    const base64 = drawImages(images, files[0].type);
    document.querySelector('#img').src = base64;
  });
});

/**
 * 根据图片文件拿到图片实例
 * @param files 图片文件对象数组
 * @param callback
 */
const readImages = files => {
  return files.map((file, index) => {
    const reader = new FileReader();
    // 把文件读为 dataUrl
    reader.readAsDataURL(file);
    return new Promise(resolve => {
      reader.onload = e => {
        const image = new Image();
        image.src = e.target.result; // 获取图片文件的base64数据
        // 解决跨域
        // image.setAttribute('crossOrigin', 'anonymous');
        // image.src = e.target.result + '?time=' + new Date().valueOf();
        image.onload = () => {
          resolve(image);
        };
      };
    });
  });
};

/**
 * 拼图
 * @param images 图片实例数组
 * @param callback
 */
const drawImages = (images, type) => {
  const heights = images.map(item => item.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...images.map(item => item.width));
  canvas.height = heights.reduce((total, current) => total + current);
  const context = canvas.getContext('2d'); // 创建渲染
  //解决背景黑
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  let y = 0; // canvas Y轴坐标
  // 遍历图片实例数组
  images.forEach((item, index) => {
    context.drawImage(item, 0, y, item.width, item.height);
    y += heights[index]; // Y轴坐标加上上一张图片高度
  });
  return canvas.toDataURL(type, 1);
};
