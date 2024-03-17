import { BottomBar } from '@/components/shared/BottomBar'
import { LeftSideBar } from '@/components/shared/LeftSideBar'
import { TopBar } from '@/components/shared/TopBar'
import { Outlet } from 'react-router-dom'

const RootLayout = () => {
  return (
    <div className='w-full md:flex'>
      <TopBar />
      <LeftSideBar />
      
      <section className='w-full h-full flex-1'>
        <Outlet />
      </section>

      <BottomBar />
    </div>
  )
}

export default RootLayout