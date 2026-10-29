/**
 * Word (.docx) 原生文档流解析器 + 真实样式/标蓝还原 + 前缀/颜色自适应 SVN 自动同步引擎
 * 100% 保持原 Word 文档的「标题 -> 段落 -> 表格 -> 段落」真实排版顺序，不做破坏性拆词
 */

function decodeXmlEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

const HIGHLIGHT_COLOR_MAP = {
  yellow: 'rgba(250, 204, 21, 0.35)',
  cyan: 'rgba(56, 189, 248, 0.35)',
  blue: 'rgba(59, 130, 246, 0.35)',
  green: 'rgba(34, 197, 94, 0.35)',
  magenta: 'rgba(236, 72, 153, 0.35)',
  red: 'rgba(244, 63, 94, 0.35)'
}

/**
 * 解析单个 <w:r> 的真实文字样式（颜色、标蓝、高亮底色、加粗、字号）
 */
function parseRunStyle(rPrXml = '') {
  const style = {
    isBlue: false,
    colorHex: '',
    bgHighlight: '',
    bold: false,
    fontSizePt: 0
  }
  if (!rPrXml) return style

  if (/<w:b(?:\s|\/|>)/i.test(rPrXml) && !/<w:b\s+w:val="(false|0)"/i.test(rPrXml)) {
    style.bold = true
  }

  const szMatch = rPrXml.match(/<w:sz[^>]*w:val="(\d+)"/i)
  if (szMatch) {
    style.fontSizePt = Math.round(parseInt(szMatch[1], 10) / 2)
  }

  const hlMatch = rPrXml.match(/<w:highlight[^>]*w:val="([^"]+)"/i)
  if (hlMatch) {
    const hl = hlMatch[1].toLowerCase()
    style.bgHighlight = HIGHLIGHT_COLOR_MAP[hl] || ''
    if (hl.includes('blue') || hl.includes('cyan')) {
      style.isBlue = true
      style.colorHex = '#38bdf8'
    }
  }

  const colorTagMatch = rPrXml.match(/<w:color[^>]*>/i)
  if (colorTagMatch) {
    const tag = colorTagMatch[0]
    const valMatch = tag.match(/w:val="([0-9A-Fa-f]{6})"/i)
    if (valMatch) {
      const hex = valMatch[1].toUpperCase()
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      // 排除纯黑或深灰默认文字
      const isDarkGrayOrBlack = r < 60 && g < 60 && b < 60
      if (!isDarkGrayOrBlack) {
        if (b > r + 25 && b >= 85) {
          style.isBlue = true
          style.colorHex = '#38bdf8'
        } else if (r > b + 40 && r >= 120) {
          style.colorHex = '#fb7185'
        } else if (g > r + 30 && g >= 100) {
          style.colorHex = '#34d399'
        } else {
          style.colorHex = `#${hex}`
        }
      }
    }
    const themeMatch = tag.match(/w:themeColor="([^"]+)"/i)
    if (themeMatch) {
      const theme = themeMatch[1].toLowerCase()
      if (theme === 'accent1' || theme === 'hyperlink' || theme === 'accent5') {
        style.isBlue = true
        style.colorHex = '#38bdf8'
      }
    }
  }

  return style
}

/**
 * 提取单个段落 <w:p> 的原样 Runs 列表（合并相邻同样式的 Run，保证标蓝密码不被拆碎）
 */
function parseParagraphNode(pXml, pIndex = 0) {
  const rawRuns = []
  let pBold = false
  let pFontSizePt = 0
  let pAlign = 'left'

  const pPrMatch = pXml.match(/<w:pPr[\s>][\s\S]*?<\/w:pPr>/)
  if (pPrMatch) {
    const pPr = pPrMatch[0]
    if (/<w:pStyle[^>]*w:val="Heading/i.test(pPr) || /<w:outlineLvl/i.test(pPr)) {
      pBold = true
      pFontSizePt = 14
    }
    const jcMatch = pPr.match(/<w:jc[^>]*w:val="([^"]+)"/i)
    if (jcMatch) {
      const val = jcMatch[1].toLowerCase()
      if (val === 'center' || val === 'right') pAlign = val
    }
  }

  const rRegex = /<w:r[\s>][\s\S]*?<\/w:r>/g
  let rMatch
  while ((rMatch = rRegex.exec(pXml)) !== null) {
    const rXml = rMatch[0]
    const rPrMatch = rXml.match(/<w:rPr[\s>][\s\S]*?<\/w:rPr>/)
    const rStyle = parseRunStyle(rPrMatch ? rPrMatch[0] : '')

    let runText = ''
    const tokenRegex = /(<w:t(?:\s+[^>]*)?>[\s\S]*?<\/w:t>)|(<w:tab\s*\/>)|(<w:br\s*\/>)/g
    let tm
    while ((tm = tokenRegex.exec(rXml)) !== null) {
      if (tm[1]) {
        const inner = tm[1].replace(/^<w:t(?:\s+[^>]*)?>|<\/w:t>$/g, '')
        runText += decodeXmlEntities(inner)
      } else if (tm[2]) {
        runText += '    '
      } else if (tm[3]) {
        runText += '\n'
      }
    }

    if (runText) {
      rawRuns.push({
        text: runText,
        isBlue: rStyle.isBlue,
        colorHex: rStyle.colorHex,
        bgHighlight: rStyle.bgHighlight,
        bold: rStyle.bold || pBold,
        fontSizePt: rStyle.fontSizePt || pFontSizePt
      })
    }
  }

  // 合并相邻且颜色/高亮属性完全一致的 Run
  const mergedRuns = []
  for (const r of rawRuns) {
    const prev = mergedRuns[mergedRuns.length - 1]
    if (
      prev &&
      prev.isBlue === r.isBlue &&
      prev.colorHex === r.colorHex &&
      prev.bgHighlight === r.bgHighlight &&
      prev.bold === r.bold
    ) {
      prev.text += r.text
    } else {
      mergedRuns.push({ ...r })
    }
  }

  const fullText = mergedRuns.map(r => r.text).join('').trim()
  const prefixMatch = fullText.match(/^([^:：0-9]{2,22})/)
  const cleanPrefix = prefixMatch
    ? prefixMatch[1].replace(/\s+/g, '')
    : fullText.slice(0, 14).replace(/\s+/g, '')
  const anchorKey = cleanPrefix ? `para:${cleanPrefix}` : `para_idx:${pIndex}`

  return {
    text: fullText,
    runs: mergedRuns,
    align: pAlign,
    isHeading: pBold || (fullText.length <= 18 && !/[:：/\\.]/.test(fullText)),
    anchorKey
  }
}

/**
 * 根据表格表头与单元格内容生成一键摘录草稿
 */
function buildRowDraft(headers, cells, cellBlueTexts, tableTitle = '', rowIdx = 0) {
  const col = {
    area: -1,
    hostName: -1,
    ip: -1,
    eip: -1,
    os: -1,
    purpose: -1,
    account: -1,
    inspectAccount: -1,
    port: -1
  }

  headers.forEach((h, idx) => {
    const c = (h || '').toLowerCase().replace(/\s+/g, '')
    if (c.includes('区域') || c.includes('环境')) {
      if (col.area === -1) col.area = idx
    } else if (c.includes('主机名') || c.includes('机器名') || c.includes('节点名')) {
      if (col.hostName === -1) col.hostName = idx
    } else if (c === 'eip' || c.includes('外网ip') || c.includes('公网ip') || c.includes('弹性ip')) {
      if (col.eip === -1) col.eip = idx
    } else if (c.includes('ip') || c.includes('地址') || c.includes('url') || c.includes('网址') || c.includes('域名')) {
      if (col.ip === -1) col.ip = idx
    } else if (c.includes('操作系统') || c.includes('系统版本') || c === 'os') {
      if (col.os === -1) col.os = idx
    } else if (c.includes('用途') || c.includes('服务') || c.includes('角色') || c.includes('功能') || c.includes('说明') || c.includes('备注')) {
      if (col.purpose === -1) col.purpose = idx
    } else if (c.includes('巡检')) {
      if (col.inspectAccount === -1) col.inspectAccount = idx
    } else if (c.includes('账号') || c.includes('用户') || c.includes('密码') || c.includes('口令') || c.includes('ak/sk')) {
      if (col.account === -1) col.account = idx
    } else if (c.includes('端口') || c.includes('port')) {
      if (col.port === -1) col.port = idx
    }
  })

  const areaVal = col.area !== -1 ? (cells[col.area] || '') : ''
  const hostNameVal = col.hostName !== -1 ? (cells[col.hostName] || '') : ''
  const ipRawVal = col.ip !== -1 ? (cells[col.ip] || '') : ''
  const eipVal = col.eip !== -1 ? (cells[col.eip] || '') : ''
  const osVal = col.os !== -1 ? (cells[col.os] || '') : ''
  const purposeVal = col.purpose !== -1 ? (cells[col.purpose] || '') : ''
  const accountVal = col.account !== -1 ? (cells[col.account] || '') : ''
  const inspectVal = col.inspectAccount !== -1 ? (cells[col.inspectAccount] || '') : ''
  let portVal = col.port !== -1 ? (cells[col.port] || '') : ''

  let target = ''
  const extraIps = []
  if (ipRawVal) {
    const parts = ipRawVal.split(/\s*\n\s*|\s*\/\s*|\s+/).filter(Boolean)
    if (parts.length > 0) {
      target = parts[0]
      if (parts.length > 1) extraIps.push(...parts.slice(1))
    }
  }
  if (!target && eipVal) target = eipVal

  if (!target) {
    for (const cell of cells) {
      const urlM = cell.match(/https?:\/\/[^\s/]+[^\s]*/i)
      const ipM = cell.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/)
      if (urlM) {
        target = urlM[0]
        break
      } else if (ipM) {
        target = ipM[0]
        break
      }
    }
  }

  let name = ''
  const shortHost = hostNameVal.replace(/^XC_V_CT_MS_/i, '')
  if (purposeVal && shortHost) {
    name = `${purposeVal} (${shortHost})`
  } else if (purposeVal) {
    name = purposeVal
  } else if (hostNameVal) {
    name = hostNameVal
  } else {
    const fallbackCell = cells.find(
      c => c && c !== target && !/麒麟|centos|ubuntu|linux|windows/i.test(c) && !/^\d+\./.test(c)
    )
    name = fallbackCell || tableTitle || '未命名节点'
  }

  let username = ''
  let password = ''
  if (accountVal) {
    const splitMatch = accountVal.match(/^([^/\\:\s]+)[/\\:\s]+(.+)$/)
    if (splitMatch) {
      username = splitMatch[1].trim()
      password = splitMatch[2].trim()
    } else {
      password = accountVal.trim()
    }
  }
  // 如果该行有标蓝文字，优先将标蓝文字作为密码
  if (Array.isArray(cellBlueTexts) && cellBlueTexts.length > 0 && !password) {
    password = cellBlueTexts[0]
  }

  const isWeb = /^https?:\/\//i.test(target)
  const category = isWeb ? 'Web网站' : '服务器账号'

  if (!username) username = isWeb ? 'admin' : 'root'
  if (!portVal && !isWeb && target) {
    const portMatch = target.match(/:(\d+)$/)
    portVal = portMatch ? portMatch[1] : '22'
  }

  const remarkParts = []
  if (areaVal) remarkParts.push(areaVal)
  if (hostNameVal && name !== hostNameVal) remarkParts.push(`主机名: ${hostNameVal}`)
  if (extraIps.length > 0) remarkParts.push(`备IP: ${extraIps.join(', ')}`)
  if (eipVal && eipVal !== target) remarkParts.push(`EIP: ${eipVal}`)
  if (osVal) remarkParts.push(osVal)
  if (inspectVal) remarkParts.push(`巡检: ${inspectVal}`)

  if (remarkParts.length === 0) {
    cells.forEach((c, idx) => {
      const hName = headers[idx] || ''
      if (c && c !== target && c !== name && c !== accountVal) {
        remarkParts.push(hName ? `${hName}: ${c}` : c)
      }
    })
  }

  const anchorKey = target
    ? `row:${target}`
    : hostNameVal
      ? `row:${hostNameVal}`
      : `row:${tableTitle}_${rowIdx}`

  return {
    category,
    name,
    target,
    port: portVal || '',
    env: areaVal || '生产环境',
    username,
    password,
    useDefaultPassword: category === '服务器账号' && !password,
    remark: remarkParts.join(' | '),
    anchorKey,
    anchorLabel: `表格行 [${target || hostNameVal || name}]`,
    syncRule: 'blue_first'
  }
}

/**
 * 按原 Word 文档的真实顺序解析所有段落与表格（输出 docBlocks 原生文档流）
 */
export function parseDocxXmlStructure(xmlString) {
  if (!xmlString) {
    return { docBlocks: [], rawParagraphs: [], rawTables: [], assets: [] }
  }

  const blockRegex = /(<w:tbl[\s\S]*?<\/w:tbl>)|(<w:p[\s>][\s\S]*?<\/w:p>)/g
  let match
  const docBlocks = []
  const rawParagraphs = []
  const rawTables = []
  let lastHeadingText = ''
  let tableIndex = 0
  let paraIndex = 0

  while ((match = blockRegex.exec(xmlString)) !== null) {
    if (match[1]) {
      // 原位表格 <w:tbl>
      const tblXml = match[1]
      const trRegex = /<w:tr[\s\S]*?<\/w:tr>/g
      let trMatch
      const allRows = []

      while ((trMatch = trRegex.exec(tblXml)) !== null) {
        const trXml = trMatch[0]
        const cells = []
        const cellRichLines = []
        const cellColspans = []
        const cellBlueTexts = []

        const tcRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g
        let tcMatch
        while ((tcMatch = tcRegex.exec(trXml)) !== null) {
          const tcXml = tcMatch[0]
          const gridSpanMatch = tcXml.match(/<w:gridSpan[^>]*w:val="(\d+)"/i)
          const colspan = gridSpanMatch ? parseInt(gridSpanMatch[1], 10) : 1

          const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g
          let pMatch
          const linesInCell = []
          const plainLines = []

          while ((pMatch = pRegex.exec(tcXml)) !== null) {
            const pNode = parseParagraphNode(pMatch[0], 0)
            if (pNode.text) {
              linesInCell.push(pNode.runs)
              plainLines.push(pNode.text)
              for (const r of pNode.runs) {
                if (r.isBlue && r.text.trim()) {
                  cellBlueTexts.push(r.text.trim())
                }
              }
            }
          }

          cells.push(plainLines.join('\n'))
          cellRichLines.push(linesInCell)
          cellColspans.push(colspan)
        }

        if (cells.some(Boolean)) {
          allRows.push({ cells, cellRichLines, cellColspans, cellBlueTexts })
        }
      }

      if (allRows.length > 0) {
        const firstRowCells = allRows[0].cells.map(c => c.replace(/\n/g, ' '))
        const headerJoined = firstRowCells.join(' ')
        const isHeader =
          allRows.length > 1 &&
          /区域|名称|主机|IP|操作系统|用途|账号|密码|端口|地址|说明|设备/i.test(headerJoined) &&
          !/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(headerJoined)

        const headers = isHeader
          ? firstRowCells
          : firstRowCells.map((_, i) => `列 ${i + 1}`)
        const dataRows = isHeader ? allRows.slice(1) : allRows
        const title = lastHeadingText || `表格 #${tableIndex + 1}`

        const formattedRows = dataRows.map((rowObj, rIdx) => ({
          id: `tbl_${tableIndex}_row_${rIdx}`,
          cells: rowObj.cells,
          cellRichLines: rowObj.cellRichLines,
          cellColspans: rowObj.cellColspans,
          cellBlueTexts: rowObj.cellBlueTexts,
          draft: buildRowDraft(headers, rowObj.cells, rowObj.cellBlueTexts, title, rIdx)
        }))

        const tableBlock = {
          type: 'table',
          id: `tbl_${tableIndex}`,
          title,
          isHeader,
          headers,
          rows: formattedRows
        }

        docBlocks.push(tableBlock)
        rawTables.push(tableBlock)
        tableIndex++
      }
    } else if (match[2]) {
      // 原位段落 <w:p>
      const pNode = parseParagraphNode(match[2], paraIndex)
      if (pNode.text) {
        if (pNode.text.length <= 28 && !/https?:\/\/|\d{1,3}\.\d{1,3}/.test(pNode.text)) {
          lastHeadingText = pNode.text
        }
        const paraBlock = {
          type: 'paragraph',
          id: `para_${paraIndex}`,
          anchorKey: pNode.anchorKey,
          sectionTitle: lastHeadingText,
          text: pNode.text,
          runs: pNode.runs,
          align: pNode.align,
          isHeading: pNode.isHeading
        }
        docBlocks.push(paraBlock)
        rawParagraphs.push(paraBlock)
        paraIndex++
      }
    }
  }

  return {
    docBlocks,
    rawParagraphs,
    rawTables,
    assets: []
  }
}

/**
 * 🔗 SVN 更新后自动同步引擎：
 * 支持：
 * 1. 自动检测该锚点段落/表格行中最新标注为 🔵蓝色 (<w:color> 蓝) 的文字；
 * 2. 若无标蓝，则根据用户首次划词时记录的「左邻前缀 (beforePrefix)」自动截取原位置的新密码！
 */
export function syncCuratedAssetsWithWord(assetList, wordDocData, currentGlobalRootPwd = '') {
  if (!wordDocData) {
    return { updatedList: assetList, updatedCount: 0, newGlobalRootPwd: currentGlobalRootPwd }
  }

  const { rawParagraphs = [], rawTables = [] } = wordDocData
  let updatedCount = 0
  let newGlobalRootPwd = currentGlobalRootPwd

  // 1. 检查全局 Root 密码段落是否有标蓝更新
  for (const para of rawParagraphs) {
    if (/服务器密码|wsupport\/root|通用密码/i.test(para.text)) {
      const blueRun = (para.runs || []).find(r => r.isBlue && r.text.trim())
      if (blueRun && blueRun.text.trim() !== currentGlobalRootPwd) {
        newGlobalRootPwd = blueRun.text.trim()
      }
    }
  }

  // 2. 遍历已摘录账本，根据锚点与左邻前缀同步最新密码
  const updatedList = assetList.map(item => {
    let matchedNewPwd = ''

    // A. 在段落中寻找匹配的 anchorKey
    if (item.anchorKey && item.anchorKey.startsWith('para:')) {
      const targetPara = rawParagraphs.find(p => p.anchorKey === item.anchorKey)
      if (targetPara) {
        // 策略1：检查该段落是否有新标蓝的密码片段
        const blueRuns = (targetPara.runs || []).filter(r => r.isBlue && r.text.trim())
        if (blueRuns.length > 0 && item.syncRule !== 'prefix_exact') {
          matchedNewPwd = blueRuns[blueRuns.length - 1].text.trim().split(/\s+/).pop()
        }
        // 策略2：根据首次划选密码时记录的 beforePrefix 提取同一位置的新密码
        if (!matchedNewPwd && item.beforePrefix && targetPara.text.includes(item.beforePrefix)) {
          const idx = targetPara.text.indexOf(item.beforePrefix) + item.beforePrefix.length
          const rest = targetPara.text.slice(idx).trim()
          const tokenMatch = rest.match(/^([^\s，。；;、]+)/)
          if (tokenMatch) {
            matchedNewPwd = tokenMatch[1]
          }
        }
        // 策略3：取该行末尾最后一个非中文字符串
        if (!matchedNewPwd) {
          const tailTokens = targetPara.text.match(/[A-Za-z0-9_!@#$%^&*().\\-]{4,}/g)
          if (tailTokens && tailTokens.length > 0) {
            matchedNewPwd = tailTokens[tailTokens.length - 1]
          }
        }
      }
    }

    // B. 在表格行中寻找匹配的 anchorKey 或 IP
    if (!matchedNewPwd) {
      const allRows = rawTables.flatMap(t => t.rows)
      const matchedRow = allRows.find(
        r =>
          (item.anchorKey && r.draft.anchorKey === item.anchorKey) ||
          (item.target && r.draft.target === item.target)
      )
      if (matchedRow) {
        if (matchedRow.cellBlueTexts?.length > 0) {
          matchedNewPwd = matchedRow.cellBlueTexts[matchedRow.cellBlueTexts.length - 1]
        } else if (matchedRow.draft.password) {
          matchedNewPwd = matchedRow.draft.password
        }
      }
    }

    if (
      matchedNewPwd &&
      !item.useDefaultPassword &&
      matchedNewPwd !== item.password
    ) {
      updatedCount++
      return {
        ...item,
        previousPassword: item.password,
        password: matchedNewPwd,
        justSynced: true,
        lastSyncedAt: new Date().toLocaleTimeString()
      }
    }

    return item
  })

  return {
    updatedList,
    updatedCount,
    newGlobalRootPwd
  }
}

/**
 * 浏览器端直接从 .docx 的 Base64 DataURL 解压出 word/document.xml 并按原文档流解析
 */
export async function parseDocxFromDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.includes(',')) return null
  const base64 = dataUrl.split(',')[1]
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const view = new DataView(bytes.buffer)

  let eocdOffset = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) return null

  const cdCount = view.getUint16(eocdOffset + 10, true)
  let cdOffset = view.getUint32(eocdOffset + 16, true)

  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break
    const method = view.getUint16(cdOffset + 10, true)
    const compSize = view.getUint32(cdOffset + 20, true)
    const nameLen = view.getUint16(cdOffset + 28, true)
    const extraLen = view.getUint16(cdOffset + 30, true)
    const commentLen = view.getUint16(cdOffset + 32, true)
    const localHeaderOffset = view.getUint32(cdOffset + 42, true)

    const nameBytes = bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen)
    const entryName = new TextDecoder('utf-8').decode(nameBytes)

    if (entryName === 'word/document.xml') {
      const localNameLen = view.getUint16(localHeaderOffset + 26, true)
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
      const compSlice = bytes.subarray(dataStart, dataStart + compSize)

      let xmlString = ''
      if (method === 0) {
        xmlString = new TextDecoder('utf-8').decode(compSlice)
      } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw')
        const stream = new Blob([compSlice]).stream().pipeThrough(ds)
        xmlString = await new Response(stream).text()
      }
      return parseDocxXmlStructure(xmlString)
    }

    cdOffset += 46 + nameLen + extraLen + commentLen
  }
  return null
}
