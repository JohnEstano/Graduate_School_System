import{j as a}from"./app-DW0Mt5c9.js";function d({targetId:n}){const r=()=>{const o=document.getElementById(n);if(!o)return;const t=window.open("","_blank","width=900,height=700");if(!t)return;const i=`
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 24px; margin-bottom: 10px; }
        h2 { font-size: 20px; margin-top: 20px; margin-bottom: 5px; }
        h3 { font-size: 16px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        th { background-color: #e5e7eb; }
        td.amount { text-align: right; }
        .panelist-info { margin-bottom: 5px; }
      </style>
    `,e=o.cloneNode(!0);e.querySelectorAll("button").forEach(l=>l.remove()),t.document.write(`
      <html>
        <head>
          <title>Print Honorarium</title>
          ${i}
        </head>
        <body>
          ${e.innerHTML}
        </body>
      </html>
    `),t.document.close(),t.focus(),t.print(),t.close()};return a.jsx("button",{onClick:r,className:"rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1 border",children:"Print"})}export{d as default};
