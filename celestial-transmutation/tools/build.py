#!/usr/bin/env python3
"""Builds src/index.html (modular, needs an http server) and dist/index.html (single file, opens anywhere)."""
import pathlib
R = pathlib.Path(__file__).resolve().parent.parent
rd = lambda p: (R / p).read_text(encoding='utf-8')
HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Celestial Transmutation — Four Worlds, One Alchemy</title>
<meta name="description" content="An interactive WebGL experience: four conceptual planets transmuting through shader energy and volumetric particles.">
<meta name="author" content="MD. Atiqul Islam (Atik)">
<meta name="theme-color" content="#02030a">
<meta property="og:title" content="Celestial Transmutation">
<meta property="og:description" content="Four conceptual planets. One fluid transformation system. Designed &amp; Developed by MD. Atiqul Islam (Atik).">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%AA%90%3C/text%3E%3C/svg%3E">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Celestial Transmutation","author":{"@type":"Person","name":"MD. Atiqul Islam (Atik)","email":"atik.cmttiu1001@gmail.com"}}</script>
'''
IMPORTMAP = '''<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/"}}
</script>
</head>
<body>
'''
SHELL = rd('tools/shell.html')
body = rd('tools/body.html')
SRC = HEAD + '<link rel="stylesheet" href="css/scene.css">\n<link rel="stylesheet" href="css/ui.css">\n' + IMPORTMAP + SHELL + body + \
      '<script type="module" src="js/scene.js"></script>\n<script src="js/ui.js"></script>\n<noscript><p style="position:fixed;inset:auto 0 50% 0;text-align:center;color:#fff">JavaScript and WebGL are required.</p></noscript>\n</body>\n</html>\n'
DIST = HEAD + '<style>\n' + rd('src/css/scene.css') + rd('src/css/ui.css') + '</style>\n' + IMPORTMAP + SHELL + body + \
       '<script type="module">\n' + rd('src/js/scene.js') + '</script>\n<script>\n' + rd('src/js/ui.js') + '</script>\n</body>\n</html>\n'
(R / 'src/index.html').write_text(SRC, encoding='utf-8')
(R / 'dist').mkdir(exist_ok=True)
(R / 'dist/index.html').write_text(DIST, encoding='utf-8')
print('built src/index.html and dist/index.html')
