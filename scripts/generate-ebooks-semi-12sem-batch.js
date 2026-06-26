const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')
const { renderHtml } = require('./lib/render-ebook-semi-12sem')

const OUT_DIR = path.join(__dirname, '../public/ebooks/semi-12sem')
fs.mkdirSync(OUT_DIR, { recursive: true })

const VMA_LIST = []
for (let v = 10; v <= 24; v += 0.5) VMA_LIST.push(Math.round(v * 10) / 10)
const SEANCES_LIST = [3, 4, 5, 6]

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  let count = 0
  const total = VMA_LIST.length * SEANCES_LIST.length

  for (const seances of SEANCES_LIST) {
    for (const vma of VMA_LIST) {
      const html = renderHtml({ vma, seances })
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.evaluateHandle('document.fonts.ready')
      const outPath = path.join(OUT_DIR, `vma-${vma}-${seances}seances.pdf`)
      await page.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
      await page.close()
      count++
      console.log(`[${count}/${total}] ${path.basename(outPath)}`)
    }
  }

  await browser.close()
  console.log(`✅ ${count} PDF générés dans ${OUT_DIR}`)
})()
