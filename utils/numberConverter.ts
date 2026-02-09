// Utility function to convert spelled-out numbers, percentages, dates, and currency to proper Indian format
export const convertSpelledNumbersToDigits = (text: string): string => {
  const numberWords: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100, 'thousand': 1000, 'lakh': 100000, 'crore': 10000000, 'million': 1000000, 'billion': 1000000000
  }

  const monthWords: { [key: string]: string } = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
  }

  const dayWords: { [key: string]: string } = {
    'first': '01', 'second': '02', 'third': '03', 'fourth': '04', 'fifth': '05', 'sixth': '06',
    'seventh': '07', 'eighth': '08', 'ninth': '09', 'tenth': '10', 'eleventh': '11', 'twelfth': '12',
    'thirteenth': '13', 'fourteenth': '14', 'fifteenth': '15', 'sixteenth': '16', 'seventeenth': '17',
    'eighteenth': '18', 'nineteenth': '19', 'twentieth': '20', 'twenty-first': '21', 'twenty-second': '22',
    'twenty-third': '23', 'twenty-fourth': '24', 'twenty-fifth': '25', 'twenty-sixth': '26',
    'twenty-seventh': '27', 'twenty-eighth': '28', 'twenty-ninth': '29', 'thirtieth': '30', 'thirty-first': '31'
  }

  // Function to parse complex Indian number expressions
  const parseIndianNumberExpression = (text: string): string => {
    // First, convert all word numbers to digits
    let processed = text
    const words = processed.split(/\s+/)
    let result: number[] = []
    
    for (let word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
      if (numberWords[cleanWord]) {
        result.push(numberWords[cleanWord])
      } else if (/^\d+$/.test(word)) {
        result.push(parseInt(word))
      }
    }
    
    // Now parse the number array using Indian number system logic
    let total = 0
    let i = 0
    
    while (i < result.length) {
      const current = result[i]
      
      // Look ahead for multipliers
      if (i + 1 < result.length) {
        const next = result[i + 1]
        
        if (next === 10000000) { // crore
          total += current * 10000000
          i += 2
          continue
        } else if (next === 100000) { // lakh
          total += current * 100000
          i += 2
          continue
        } else if (next === 1000) { // thousand
          total += current * 1000
          i += 2
          continue
        } else if (next === 100) { // hundred
          total += current * 100
          i += 2
          continue
        }
      }
      
      // If no multiplier found, add the current number
      total += current
      i++
    }
    
    return total.toString()
  }

  // Format Indian currency with proper commas
  const formatIndianCurrency = (amount: number): string => {
    if (amount >= 10000000) { // 1 crore or more
      const crore = Math.floor(amount / 10000000)
      const remainder = amount % 10000000
      if (remainder === 0) {
        return `₹${crore},00,00,000`
      } else {
        const lakh = Math.floor(remainder / 100000)
        const remaining = remainder % 100000
        let result = `₹${crore}`
        if (lakh > 0) result += `,${lakh.toString().padStart(2, '0')}`
        else result += `,00`
        if (remaining > 0) result += `,${remaining.toString().padStart(5, '0')}`
        else result += `,00,000`
        return result
      }
    } else if (amount >= 100000) { // 1 lakh or more
      const lakh = Math.floor(amount / 100000)
      const remaining = amount % 100000
      if (remaining === 0) {
        return `₹${lakh},00,000`
      } else {
        return `₹${lakh},${remaining.toString().padStart(5, '0')}`
      }
    } else if (amount >= 1000) { // 1 thousand or more
      const thousand = Math.floor(amount / 1000)
      const remaining = amount % 1000
      if (remaining === 0) {
        return `₹${thousand},000`
      } else {
        return `₹${thousand},${remaining.toString().padStart(3, '0')}`
      }
    } else {
      return `₹${amount}`
    }
  }

  let processedText = text

  // First, handle percentages - convert "percent" to "%"
  processedText = processedText.replace(/\bpercent\b/gi, '%')

  // Handle currency - convert "rupees", "rupee", "rs" to "₹"
  processedText = processedText.replace(/\b(rupees?|rs)\b/gi, '₹')

  // Handle year patterns with hyphenated numbers like "two thousand twenty-four"
  const yearPatternHyphen = /\b(two)\s+thousand\s+(twenty-four|twenty-three|twenty-two|twenty-one|twenty)\b/gi
  processedText = processedText.replace(yearPatternHyphen, (match, thousand, year) => {
    if (thousand === 'two') {
      let yearNum = '20'
      if (year === 'twenty') yearNum = '2020'
      else if (year === 'twenty-one') yearNum = '2021'
      else if (year === 'twenty-two') yearNum = '2022'
      else if (year === 'twenty-three') yearNum = '2023'
      else if (year === 'twenty-four') yearNum = '2024'
      return yearNum
    }
    return match
  })

  // Handle date patterns like "first of May" or "1st of May"
  const datePattern1 = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty-second|twenty-third|twenty-fourth|twenty-fifth|twenty-sixth|twenty-seventh|twenty-eighth|twenty-ninth|thirtieth|thirty-first)\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi
  processedText = processedText.replace(datePattern1, (match, day, month) => {
    const monthNum = monthWords[month.toLowerCase()]
    const dayNum = dayWords[day.toLowerCase()]
    if (monthNum && dayNum) {
      return `${dayNum}/${monthNum}`
    }
    return match
  })

  // Handle date patterns like "1st of May" or "2nd of May"
  const datePattern2 = /\b(\d+)(st|nd|rd|th)\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi
  processedText = processedText.replace(datePattern2, (match, day, suffix, month) => {
    const monthNum = monthWords[month.toLowerCase()]
    const dayNum = day.padStart(2, '0')
    if (monthNum) {
      return `${dayNum}/${monthNum}`
    }
    return match
  })

  // Handle compound numbers like "twenty-five"
  const compoundPattern = /(\w+)-(\w+)/g
  processedText = processedText.replace(compoundPattern, (match, first, second) => {
    const firstNum = numberWords[first.toLowerCase()]
    const secondNum = numberWords[second.toLowerCase()]
    if (firstNum !== undefined && secondNum !== undefined) {
      return (firstNum + secondNum).toString()
    }
    return match
  })

  // Process complex Indian number expressions first (before individual word conversion)
  const complexIndianPattern = /\b\d+\s+(?:lakh|crore|thousand|hundred)(?:\s+\d+)*(?:\s+₹)?\b/gi
  processedText = processedText.replace(complexIndianPattern, (match) => {
    // Remove ₹ if present for parsing, we'll add it back later
    const cleanMatch = match.replace(/₹/g, '').trim()
    const parsedAmount = parseIndianNumberExpression(cleanMatch)
    return match.includes('₹') ? `${parsedAmount} ₹` : parsedAmount
  })

  // Split text into words and process each word
  const words = processedText.split(/\s+/)
  const processedWords: string[] = []
  
  // First pass: convert individual number words and multipliers
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
    
    // Skip processing if this word is already a year number
    if (/^20\d{2}$/.test(word)) {
      processedWords.push(word)
      continue
    }
    
    // Skip if this is already a number
    if (/^\d+$/.test(word)) {
      processedWords.push(word)
      continue
    }
    
    if (numberWords[cleanWord]) {
      // Check if next word is a multiplier (hundred, thousand, lakh, crore, million, billion)
      if (i + 1 < words.length) {
        const nextWord = words[i + 1].toLowerCase().replace(/[^a-z]/g, '')
        if (nextWord === 'hundred' || nextWord === 'thousand' || nextWord === 'lakh' || nextWord === 'crore' || nextWord === 'million' || nextWord === 'billion') {
          const multiplier = numberWords[nextWord]
          const number = numberWords[cleanWord]
          processedWords.push((number * multiplier).toString())
          i++ // Skip the next word since we've processed it
          continue
        }
      }
      
      processedWords.push(numberWords[cleanWord].toString())
    } else {
      processedWords.push(word)
    }
  }
  
  // Second pass: combine numbers in Indian number system
  let finalText = processedWords.join(' ')
  
  // Handle remaining number combinations
  const numberCombinationPattern = /(\d+)\s+(\d+)/g
  finalText = finalText.replace(numberCombinationPattern, (match, num1, num2) => {
    const first = parseInt(num1)
    const second = parseInt(num2)
    if (!isNaN(first) && !isNaN(second)) {
      // Special case: "2020 2" should become "2022" (2 thousand twenty-two)
      if (/^20\d{2}$/.test(num1) && second <= 99) {
        // This is a year + additional year part (like "2020 2" → "2022")
        return (first + second).toString()
      }
      
      // Don't combine other year numbers
      if (/^20\d{2}$/.test(num1) || /^20\d{2}$/.test(num2)) {
        return match
      }
      
      // Only combine if it makes sense (avoid combining dates like "2020 2")
      if (first < 50 && second < 50) {
        // Don't combine small numbers that might be dates
        return match
      }
      
      // Handle Indian number system combinations
      if (first >= 100000 && second < 100000) { // lakh + smaller number
        return (first + second).toString()
      } else if (first >= 10000000 && second < 10000000) { // crore + smaller number
        return (first + second).toString()
      } else if (first >= 1000 && second < 1000 && first % 1000 === 0) { // thousand + smaller number
        return (first + second).toString()
      } else if (first >= 100 && second < 100 && first % 100 === 0) { // hundred + smaller number
        return (first + second).toString()
      }
    }
    return match
  })

  // Third pass: format Indian currency amounts with proper commas and ₹ symbol
  const indianAmountPattern = /(\d+)\s*₹/g
  finalText = finalText.replace(indianAmountPattern, (match, amount) => {
    const num = parseInt(amount)
    if (!isNaN(num)) {
      return formatIndianCurrency(num)
    }
    return match
  })
  
  return finalText
}
