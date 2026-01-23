import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';
import { create } from '../../lib/chrome/tabs';
import { removeAll } from '../../lib/chrome/cookies';

interface ToolItem {
  name: string;
  url: string;
  type: 'jump' | 'clearCookie';
}

const tools: ToolItem[] = [
  { name: 'json', url: 'json.html', type: 'jump' },
  { name: '字符串编解码', url: 'convert.html', type: 'jump' },
  { name: '代码美化', url: 'codebeautify.html', type: 'jump' },
  { name: '时间戳转换', url: 'timestamp.html', type: 'jump' },
  { name: '图片Base64', url: 'imagebase64.html', type: 'jump' },
  { name: '颜色转换', url: 'colorTransform.html', type: 'jump' },
  { name: '图片拼接', url: 'pictureSplicing.html', type: 'jump' },
  { name: 'uglify', url: 'uglify.html', type: 'jump' },
  { name: '清除Cookie', url: '', type: 'clearCookie' },
  { name: '进制转换', url: 'trans-radix.html', type: 'jump' },
];

function App() {
  return (
    <div className="w-[120px]">
      <ul className="m-0 p-0 text-base">
        {tools.map((tool) => (
          <li
            key={tool.name}
            className="mx-0 my-0.5 px-1.5 py-1.5 list-none cursor-pointer rounded hover:bg-[#008050] hover:text-white"
            onClick={() => handleToolClick(tool)}
          >
            {tool.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function handleToolClick(tool: ToolItem) {
  if (tool.type === 'jump') {
    await create(tool.url);
  } else if (tool.type === 'clearCookie') {
    await removeAll();
    alert('Cookie 已清除');
  }
}

// Mount the React app
const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
