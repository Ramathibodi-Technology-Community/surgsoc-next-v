import type { Block } from 'payload'
import { conditionalGroup } from './conditionalGroup'
import { labelField, nameField, requiredField, widthField } from './shared'

export const FileUploadBlock: Block = {
  slug: 'fileUpload',
  labels: {
    singular: 'File Upload',
    plural: 'File Uploads',
  },
  fields: [
    {
      type: 'row',
      fields: [nameField, labelField],
    },
    {
      type: 'row',
      fields: [widthField, requiredField],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'accept',
          type: 'text',
          label: 'Accepted file types (e.g. .pdf,.docx,image/*)',
          admin: { width: '50%' },
        },
        {
          name: 'maxSize',
          type: 'number',
          label: 'Maximum file size (MB)',
          defaultValue: 5,
          admin: { width: '50%' },
        },
      ],
    },
    conditionalGroup,
  ],
}
