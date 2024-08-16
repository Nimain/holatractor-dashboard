import dynamic from 'next/dynamic'

const LogIn = dynamic(
    ()=> import('@/components/Authentication/Login'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const LogInPage = () => {

  return (
    <LogIn />
  )
}

export default LogInPage