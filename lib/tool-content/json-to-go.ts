import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This JSON to Go converter turns a sample JSON document into Go struct definitions with json tags, ready to use with encoding/json. Paste an API response or config file and get a typed starting point instead of writing structs field by field.',
    'Field names are converted to exported PascalCase and follow the usual Go initialism style, so user_id becomes UserID and image_url becomes ImageURL. Each field keeps its original JSON key in a tag such as json:"user_id". Nested objects become their own named structs, and the Root type is listed first so the output reads top-down. The conversion is processed on your device as you type.',
  ],
  steps: [
    'Paste a JSON object or array into the JSON input box.',
    'Read the generated code in the Go structs panel; it refreshes on every edit.',
    'If an error appears, fix the invalid JSON it points to.',
    'Click copy to grab the structs, or download to save them as types.go.',
    'Rename the Root struct and adjust any types to fit your package.',
  ],
  faq: [
    {
      q: 'Which Go types does it use for numbers?',
      a: 'Whole numbers in the sample become int64 and numbers with a fractional part become float64. If a field can hold both, change it to float64 yourself, since the type is decided from the sample value.',
    },
    {
      q: 'How are null values and empty arrays typed?',
      a: 'A null field becomes interface{} and an empty array becomes []interface{}, because the sample gives no clue about the real type. When objects in an array are merged, a non-null sample is preferred where one exists.',
    },
    {
      q: 'Does it add omitempty or pointer types?',
      a: 'No. Tags contain only the JSON key, and fields are plain values rather than pointers. Add ,omitempty or switch to pointers by hand where you need to tell a missing field from a zero value.',
    },
    {
      q: 'How does it handle arrays of objects?',
      a: 'All objects in the array are merged into one struct that has the union of their keys, and the field becomes a slice of that struct. For arrays of scalars or arrays, the element type comes from the first element only.',
    },
    {
      q: 'What if the top-level JSON is an array?',
      a: 'An array of objects produces a Root struct for one element plus a RootList slice type. An array of scalars produces a single slice type, and a plain top-level value produces a one-line type such as type Root string.',
    },
  ],
}

export default content
