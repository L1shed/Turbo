import { ArrowRight } from "lucide-react";

const NodeButton = ({ 
  text = "Run a Node", 
  onClick = () => console.log("Button clicked"),
  disabled = false
}) => (
  <div className="relative inline-block">
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        cursor-pointer
        group relative inline-flex items-center justify-between
        px-3 py-2 pr-2 pl-3
        bg-white/80
        hover:bg-white/70 hover:shadow-lg
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        rounded-full
        border-2 border-white/40
        text-gray-700 hover:text-gray-900
        font-medium text-base
        transition-all duration-200 ease-out
      `}
      style={{
        border: "10px solid rgba(255,255,255,0.4)",
        backgroundClip: "padding-box",
        position: "relative",
        overflow: "visible"
      }}
    >
      <span className="flex-1 text-3xl px-4">
        {text}
      </span>
      <div className="flex items-center justify-center w-12 h-12 bg-gray-600 rounded-full group-hover:bg-gray-700 transition-colors duration-300">
        <ArrowRight 
          className="text-white w-6 h-6 group-hover:translate-x-0.5 transition-transform duration-300" 
        />
      </div>
    </button>
  </div>
);

export default NodeButton;
