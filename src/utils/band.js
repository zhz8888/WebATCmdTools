/**
 * LTE 频段位图编解码工具
 *
 * 位图约定：最低有效位（bit0）对应 baseBand，向上依次递增，
 * 即偏移 n 的位表示频段 baseBand + n，与设备侧 Bn -> 2 ** (n - baseBand) 的编码一致。
 * 各平台高频段（B38-B41）与低频段（B1/B3/B5/B8）分别位于各自的位图字段中，
 * 通过 baseBand 指定字段起始频段即可复用同一套编解码。
 */

/**
 * 将位图二进制字符串解码为频段号列表
 * @param {string} bits 位图二进制字符串（最高位在前，如 '1011' 表示 bit0 与 bit1、bit3 置位）
 * @param {object} [options] 可选配置
 * @param {number} [options.baseBand=1] bit0 对应的频段号
 * @param {number[]|null} [options.allowed=null] 仅保留列表内的频段，null 表示不过滤
 * @returns {number[]} 按频段号升序排列的列表
 */
export function decodeBandBitmap(bits, { baseBand = 1, allowed = null } = {}) {
  return String(bits)
    .split('')
    .reverse()
    .reduce((bands, bit, offset) => {
      const band = baseBand + offset
      if (bit === '1' && (!allowed || allowed.includes(band))) {
        bands.push(band)
      }
      return bands
    }, [])
}

/**
 * 将频段号列表编码为位图整数
 * @param {number[]} bands 频段号列表
 * @param {object} [options] 可选配置
 * @param {number} [options.baseBand=1] bit0 对应的频段号
 * @param {number} [options.maxOffset=31] 最大位偏移，超出该偏移的频段被忽略
 * @param {number[]|null} [options.allowed=null] 仅编码列表内的频段，null 表示不过滤
 * @returns {number} 位图整数
 */
export function encodeBandBitmap(bands, { baseBand = 1, maxOffset = 31, allowed = null } = {}) {
  return bands.reduce((bitmap, band) => {
    const offset = band - baseBand
    if (offset < 0 || offset > maxOffset) {
      return bitmap
    }
    if (allowed && !allowed.includes(band)) {
      return bitmap
    }
    return bitmap + 2 ** offset
  }, 0)
}
