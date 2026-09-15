import serialize from "serialize-javascript";

export default function template(body, initialData, userData) {
  return `<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8">
<title>Pro MERN Stack</title>

<link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css" >
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script
  src="https://accounts.google.com/gsi/client"
  async
  defer
  onload="window.dispatchEvent(new Event('google-identity-services-loaded'))"
></script>

<style>
table.table-hover tr {cursor: pointer;}
.panel-title a {display: block; width: 100%; cursor: pointer;}
</style>
</head>

<body>
<div id="contents">${body}</div>
<script>
window.__INITIAL_DATA__ = ${serialize(initialData)}
window.__USER_DATA__ = ${serialize(userData)}
</script>
<script src="/env.js"></script>
<script src="/vendor.bundle.js"></script>
<script src="/app.bundle.js"></script>
</body>
</html>`;
}

// module.export = template;
