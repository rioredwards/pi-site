import { cn } from "../../lib/utils";

interface Props {
  className?: string;
  width?: number;
}

function YouTube({ width = 20, className }: Props) {
  return (
    <svg
      role="img"
      height="100%"
      width={width}
      className={cn(
        className,
        "text-[#FF0000] filter-none hover:scale-105 hover:brightness-105",
      )}
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinejoin: "round",
        strokeMiterlimit: 2,
      }}
      viewBox="0 0 121.485 85.039"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>YouTube</title>
      <path
        d="m118.946,13.279c-1.397-5.227-5.514-9.343-10.741-10.74C98.732,0,60.742,0,60.742,0c0,0-37.989,0-47.463,2.539C8.052,3.936,3.936,8.052,2.539,13.279,0,22.753,0,42.52,0,42.52c0,0,0,19.767,2.539,29.241,1.397,5.227,5.514,9.343,10.741,10.74,9.474,2.539,47.463,2.539,47.463,2.539,0,0,37.989,0,47.463-2.539,5.227-1.397,9.343-5.514,10.741-10.74,2.539-9.474,2.539-29.241,2.539-29.241,0,0,0-19.767-2.539-29.241Z"
        strokeWidth="0"
        style={{ fill: "currentcolor" }}
      />
      <polygon
        points="48.594 60.742 80.155 42.52 48.594 24.297 48.594 60.742"
        fill="#fff"
        strokeWidth="0"
      />
    </svg>
  );
}

export default YouTube;
