"""Builds CareBridge into one HTML file.
   index.html                    -> the website (Vercel): real Epic sign-in, server features, installable app
   build/carebridge-claude.html  -> body-only version for publishing as a claude.ai link"""
import pathlib
src = pathlib.Path(__file__).parent
root = src.parent
css = (src/'styles.css').read_text(encoding='utf-8')
js = '\n'.join((src/f).read_text(encoding='utf-8') for f in ['i18n.js', 'core.js', 'ui.js'])
fonts = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&display=swap'
libs = '''<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>'''
body = f'''<title>CareBridge</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="CareBridge helps seniors book doctor visits by voice in their own language and get rides from family without having to ask.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<style>
{css}
</style>
<div id="root"></div>
<noscript>CareBridge needs JavaScript to run.</noscript>
{libs}
<script>
{js}
</script>
'''
(root/'build').mkdir(exist_ok=True)
(root/'build'/'carebridge-claude.html').write_text(body, encoding='utf-8')
full = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#C9400A">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CareBridge">
</head>
<body>
{body}
</body>
</html>
'''
(root/'index.html').write_text(full, encoding='utf-8')
print('built index.html', len(full)//1024, 'KB')
