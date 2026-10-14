/** STUB — shell worker owns this file. */
interface Props {
  title: string
  description: string
  image?: string
}

export default function Seo({ title, description, image: _image }: Props) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  )
}
