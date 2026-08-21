import dynamic from 'next/dynamic'

// Client component is large; load normally
const GalliExperience = dynamic(() => import('../components/GalliExperience'), { ssr: false })

export default function Page(){
  return (
    <main>
      <GalliExperience />
    </main>
  )
}
