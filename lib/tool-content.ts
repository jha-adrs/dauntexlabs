import type { ToolContent } from './tool-content/types'
import aadhaarMasker from './tool-content/aadhaar-masker'
import amountInWordsRupees from './tool-content/amount-in-words-rupees'
import chanakyaToUnicode from './tool-content/chanakya-to-unicode'
import cidrCalculator from './tool-content/cidr-calculator'
import cronToSystemdTimer from './tool-content/cron-to-systemd-timer'
import crosswindComponent from './tool-content/crosswind-component'
import dateCalculator from './tool-content/date-calculator'
import dateDifference from './tool-content/date-difference'
import densityAltitudeCalculator from './tool-content/density-altitude-calculator'
import devlysToUnicode from './tool-content/devlys-to-unicode'
import gpxConverter from './tool-content/gpx-converter'
import hashGenerator from './tool-content/hash-generator'
import homoglyphDetector from './tool-content/homoglyph-detector'
import icsViewer from './tool-content/ics-viewer'
import jsonPivot from './tool-content/json-pivot'
import keywordDensity from './tool-content/keyword-density'
import krutidevToUnicode from './tool-content/krutidev-to-unicode'
import metaTagGenerator from './tool-content/meta-tag-generator'
import morseCode from './tool-content/morse-code'
import pdfMetadataRemover from './tool-content/pdf-metadata-remover'
import photoDateStamp from './tool-content/photo-date-stamp'
import randomNumberGenerator from './tool-content/random-number-generator'
import sqlToCsv from './tool-content/sql-to-csv'
import trueAirspeedCalculator from './tool-content/true-airspeed-calculator'
import vcfToCsv from './tool-content/vcf-to-csv'
import windCorrectionAngle from './tool-content/wind-correction-angle'
import gstinValidator from './tool-content/gstin-validator'
import aadhaarValidator from './tool-content/aadhaar-validator'
import hindiTypingKeyboard from './tool-content/hindi-typing-keyboard'
import metarDecoder from './tool-content/metar-decoder'
import tafDecoder from './tool-content/taf-decoder'
import cloudBaseCalculator from './tool-content/cloud-base-calculator'
import pressureAltitudeCalculator from './tool-content/pressure-altitude-calculator'
import flightTimeFuelCalculator from './tool-content/flight-time-fuel-calculator'
import weightAndBalanceCalculator from './tool-content/weight-and-balance-calculator'
import subtitleSyncFixer from './tool-content/subtitle-sync-fixer'
import harSanitizer from './tool-content/har-sanitizer'
import emlViewer from './tool-content/eml-viewer'
import qrCodeGenerator from './tool-content/qr-code-generator'
import upiQrCodeGenerator from './tool-content/upi-qr-code-generator'

export type { ToolContent } from './tool-content/types'

// One file per tool in lib/tool-content/<slug>.ts (default export). Register it here.
// Rendered server-side by components/ToolAbout.tsx; tools without an entry show nothing extra.
export const TOOL_CONTENT: Record<string, ToolContent> = {
  'aadhaar-masker': aadhaarMasker,
  'amount-in-words-rupees': amountInWordsRupees,
  'chanakya-to-unicode': chanakyaToUnicode,
  'cidr-calculator': cidrCalculator,
  'cron-to-systemd-timer': cronToSystemdTimer,
  'crosswind-component': crosswindComponent,
  'date-calculator': dateCalculator,
  'date-difference': dateDifference,
  'density-altitude-calculator': densityAltitudeCalculator,
  'devlys-to-unicode': devlysToUnicode,
  'gpx-converter': gpxConverter,
  'hash-generator': hashGenerator,
  'homoglyph-detector': homoglyphDetector,
  'ics-viewer': icsViewer,
  'json-pivot': jsonPivot,
  'keyword-density': keywordDensity,
  'krutidev-to-unicode': krutidevToUnicode,
  'meta-tag-generator': metaTagGenerator,
  'morse-code': morseCode,
  'pdf-metadata-remover': pdfMetadataRemover,
  'photo-date-stamp': photoDateStamp,
  'random-number-generator': randomNumberGenerator,
  'sql-to-csv': sqlToCsv,
  'true-airspeed-calculator': trueAirspeedCalculator,
  'vcf-to-csv': vcfToCsv,
  'wind-correction-angle': windCorrectionAngle,
  'gstin-validator': gstinValidator,
  'aadhaar-validator': aadhaarValidator,
  'hindi-typing-keyboard': hindiTypingKeyboard,
  'metar-decoder': metarDecoder,
  'taf-decoder': tafDecoder,
  'cloud-base-calculator': cloudBaseCalculator,
  'pressure-altitude-calculator': pressureAltitudeCalculator,
  'flight-time-fuel-calculator': flightTimeFuelCalculator,
  'weight-and-balance-calculator': weightAndBalanceCalculator,
  'subtitle-sync-fixer': subtitleSyncFixer,
  'har-sanitizer': harSanitizer,
  'eml-viewer': emlViewer,
  'qr-code-generator': qrCodeGenerator,
  'upi-qr-code-generator': upiQrCodeGenerator,
}
