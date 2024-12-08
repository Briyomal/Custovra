const Input = ({icon:Icon,...props}) => {
  return (
    <div className='relative mb-6'>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon className="size-5 text-blue-500 dark:text-blue-300"></Icon>
      </div>
      <input 
        {...props}
        className='w-full pl-10 pr-3 py-2 bg-gray-50 bg-opacity-50 rounded-lg border border-gray-400 
        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none 
        text-gray-800 placeholder-gray-500 transition duration-200
        dark:bg-gray-800 dark:bg-opacity-50 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-50' 
      />
    </div>
  )
}

export default Input
