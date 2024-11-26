import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`
            w-full rounded-md border border-gray-300 bg-white 
            py-2 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm 
            placeholder:text-gray-500 focus:outline-none 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${className}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
