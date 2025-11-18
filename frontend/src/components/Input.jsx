const Input = ({icon:Icon,...props}) => {
  return (
    <div className='relative mb-6'>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon className="size-5 text-[#16bf4c] dark:text-[#16bf4c]"></Icon>
      </div>
      <input 
        {...props}
        className='w-full pl-10 pr-3 py-3 bg-gray-50 bg-opacity-50 rounded-md border border-gray-400 
        focus:border-lime-500 focus:ring-1 focus:ring-lime-500 focus:outline-none 
        text-gray-800 placeholder-gray-500 transition duration-200
        dark:bg-[#0D0D0D] dark:bg-opacity-50 dark:border-[#313131] dark:placeholder-[#8a8a8a] dark:text-white dark:focus:border-lime-500 dark:focus:ring-lime-500' 
      />
    </div>
  )
}

export default Input
