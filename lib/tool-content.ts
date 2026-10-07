import type { ToolContent } from './tool-content/types'
import cidrCalculator from './tool-content/cidr-calculator'
import dateCalculator from './tool-content/date-calculator'
import dateDifference from './tool-content/date-difference'
import hashGenerator from './tool-content/hash-generator'
import jsonPivot from './tool-content/json-pivot'
import keywordDensity from './tool-content/keyword-density'
import metaTagGenerator from './tool-content/meta-tag-generator'
import morseCode from './tool-content/morse-code'
import randomNumberGenerator from './tool-content/random-number-generator'
import sqlToCsv from './tool-content/sql-to-csv'

export type { ToolContent } from './tool-content/types'

// One file per tool in lib/tool-content/<slug>.ts (default export). Register it here.
// Rendered server-side by components/ToolAbout.tsx; tools without an entry show nothing extra.
export const TOOL_CONTENT: Record<string, ToolContent> = {
  'cidr-calculator': cidrCalculator,
  'date-calculator': dateCalculator,
  'date-difference': dateDifference,
  'hash-generator': hashGenerator,
  'json-pivot': jsonPivot,
  'keyword-density': keywordDensity,
  'meta-tag-generator': metaTagGenerator,
  'morse-code': morseCode,
  'random-number-generator': randomNumberGenerator,
  'sql-to-csv': sqlToCsv,
}
