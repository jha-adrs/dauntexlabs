import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This JSON to TypeScript converter reads a sample JSON document and writes matching TypeScript interfaces for it. Paste an API response, a config file or a fixture and you get a starting set of types to drop into your project instead of typing every field by hand.',
    'The top-level object becomes an interface called Root. Each nested object gets its own interface named after its key in PascalCase, so a "shipping_address" field produces a ShippingAddress interface, and arrays of objects produce a name ending in Item, such as LineItemsItem. Nested interfaces are listed first and Root comes last. The conversion runs in your browser as you type, so it is handy for payloads you would rather keep on your own machine.',
  ],
  steps: [
    'Paste a JSON object or array into the JSON input box.',
    'Read the generated code in the TypeScript interfaces panel; it updates on every keystroke.',
    'If the JSON is malformed, fix the problem shown in the error message and the output reappears.',
    'Click copy to put the interfaces on your clipboard, or download to save them as types.ts.',
    'Review the result and refine it by hand where your real data varies from the sample.',
  ],
  faq: [
    {
      q: 'How are field types decided?',
      a: 'From the sample values only. Strings become string, numbers become number, true and false become boolean, and null becomes the null type. An empty array becomes unknown[], and an array of mixed primitives becomes a union such as (string | number)[].',
    },
    {
      q: 'Does it mark fields as optional?',
      a: 'No. Every field is written as required, and there is no ? modifier. When an array holds several objects with different keys, the keys are merged into one interface, but each key is typed from the first object that has it and none are flagged optional. Add ? yourself for fields that can be missing.',
    },
    {
      q: 'What happens to a field that is null in my sample?',
      a: 'It is typed as null, because that is all the sample shows. If the field normally holds a string, change it to string | null after generating.',
    },
    {
      q: 'What if two nested objects share the same key name?',
      a: 'The second interface gets a number appended, for example Address and Address2, so the names do not collide. You may want to merge or rename them.',
    },
    {
      q: 'Can I convert a top-level array or a plain value?',
      a: 'A top-level array of objects is merged into a single Root interface describing one element. A plain string, number or boolean at the top level only produces a comment noting the primitive type, since there is nothing to describe as an interface.',
    },
  ],
}

export default content
