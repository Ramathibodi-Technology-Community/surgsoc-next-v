import React, { Fragment } from 'react'
import escapeHTML from 'escape-html'
import { IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE, IS_CODE, IS_SUBSCRIPT, IS_SUPERSCRIPT } from '@/libs/richText/nodeFormat'

interface Props {
  nodes: any[]
}

export const SerializeLexical: React.FC<Props> = ({ nodes }) => {
  return (
    <Fragment>
      {nodes?.map((node, i) => {
        if (node.type === 'text') {
          let text = <span key={i} dangerouslySetInnerHTML={{ __html: escapeHTML(node.text) }} />
          if (node.format & IS_BOLD) {
            text = <strong key={i}>{text}</strong>
          }
          if (node.format & IS_ITALIC) {
            text = <em key={i}>{text}</em>
          }
          if (node.format & IS_STRIKETHROUGH) {
            text = <span key={i} style={{ textDecoration: 'line-through' }}>{text}</span>
          }
          if (node.format & IS_UNDERLINE) {
            text = <span key={i} style={{ textDecoration: 'underline' }}>{text}</span>
          }
          if (node.format & IS_CODE) {
            text = <code key={i}>{text}</code>
          }
           if (node.format & IS_SUBSCRIPT) {
            text = <sub key={i}>{text}</sub>
          }
          if (node.format & IS_SUPERSCRIPT) {
            text = <sup key={i}>{text}</sup>
          }

          return text
        }

        if (!node) {
          return null
        }

        const serializedChildren = node.children ? SerializeLexical({ nodes: node.children }) : null

        switch (node.type) {
            case 'linebreak':
                return <br key={i} />
            case 'paragraph':
                return <p key={i}>{serializedChildren}</p>
            case 'heading':
                const Tag = node.tag as any
                return <Tag key={i}>{serializedChildren}</Tag>
            case 'list':
                const ListTag = node.tag as any
                return (
                    <ListTag key={i} className="list-decimal ml-4">
                        {serializedChildren}
                    </ListTag>
                )
            case 'listitem':
                return (
                    <li key={i} value={node.value}>
                        {serializedChildren}
                    </li>
                )
            case 'quote':
                return <blockquote key={i} className="border-l-4 border-gray-300 pl-4 italic">{serializedChildren}</blockquote>
            case 'link':
                return (
                    <a href={node.fields.url} key={i} target={node.fields.newTab ? '_blank' : '_self'} rel={node.fields.newTab ? 'noopener noreferrer' : ''} className="text-blue-600 underline hover:no-underline">
                        {serializedChildren}
                    </a>
                )

            default:
                return <Fragment key={i}>{serializedChildren}</Fragment>
        }
      })}
    </Fragment>
  )
}
