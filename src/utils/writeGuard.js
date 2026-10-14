/**
 * 写号保护：IMEI / SN / MAC 等写号命令会直接改写设备 NVRAM 中的身份数据，
 * 发送前统一做格式校验与二次确认，避免空值或误输入被写入设备。
 */

/** 各写号字段的校验规则：label 用于提示，hint 说明正确格式，test 判定取值是否合法 */
const writeRules = {
  imei: {
    label: 'IMEI',
    hint: '需为 15 位数字',
    test: value => /^\d{15}$/.test(value)
  },
  sn: {
    label: 'SN',
    hint: '不能为空且不能包含空白字符',
    test: value => value.length > 0 && !/\s/.test(value)
  },
  mac: {
    label: 'MAC',
    hint: '需为 12 位十六进制，可用 : 或 - 分隔',
    test: value => /^[0-9a-fA-F]{2}([:-]?[0-9a-fA-F]{2}){5}$/.test(value)
  }
}

/**
 * 校验并二次确认待写入的值
 * 未通过校验或用户取消确认时返回 null，调用方据此跳过发送
 * @param {string} ruleName writeRules 中的规则名（imei / sn / mac）
 * @param {string} rawValue 输入框中的原始内容
 * @returns {string|null} 去掉首尾空白后的取值，或 null
 */
export function confirmWriteValue(ruleName, rawValue) {
  const rule = writeRules[ruleName]
  const value = String(rawValue ?? '').trim()

  if (!rule.test(value)) {
    alert(`${rule.label} 格式不正确：${rule.hint}`)
    return null
  }

  if (!confirm(`确认将 ${rule.label} ${value} 写入设备？`)) {
    return null
  }

  return value
}
