//components/Splitter.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";

interface SplitterProps {
  direction?: "horizontal" | "vertical";
  children: React.ReactNode[];
  initialSizes?: number[];
  minSizes?: number[];
}

const Splitter: React.FC<SplitterProps> = ({
  direction = "horizontal",
  children,
  initialSizes,
  minSizes = [],
}) => {
  // 1. 存储各面板的尺寸（百分比）
  const [sizes, setSizes] = useState<number[]>(
    initialSizes || children.map(() => 100 / children.length),
  );
  // 2. 标识是否在拖拽 & 正在拖拽哪条分割线
  const [isDragging, setIsDragging] = useState(false);
  const [activeSplitter, setActiveSplitter] = useState<number | null>(null);

  // 3. 用于获取容器的 DOM 及大小
  const containerRef = useRef<HTMLDivElement>(null);

  // 4. 用于记录 mousedown 时的一些初始数据
  const startPosRef = useRef<number>(0); // 鼠标在 X/Y 维度的起始位置
  const initialSizesRef = useRef<number[]>([]); // mousedown 时各面板的原始大小

  // 当 children 数量变化时，同步 size
  useEffect(() => {
    const childCount = children.length;
    if (sizes.length !== childCount) {
      const newSizes = initialSizes || Array(childCount).fill(100 / childCount);
      setSizes(newSizes);
    }
  }, [children.length, initialSizes]);

  // =============== 鼠标事件回调 ===============

  // (A) 按下分割条
  const handleMouseDown = useCallback(
    (index: number, e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault(); // 避免选中文字或产生拖拽阴影
      setIsDragging(true);
      setActiveSplitter(index);

      
      console.log('down')
      // 记录按下时的鼠标位置 & 当前 sizes
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
      initialSizesRef.current = [...sizes]; // 克隆一份当前尺寸
    },
    [direction, sizes],
  );

  // (B) 松开鼠标(无论在哪)
  const handleMouseUp = useCallback(() => {
    console.log('up')
    setIsDragging(false);
    setActiveSplitter(null);
  }, []);

  // (C) 拖拽移动：更新尺寸
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || activeSplitter === null || !containerRef.current) {
        return;
      }
      console.log('move')

      // 1. 计算容器大小
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize =
        direction === "horizontal" ? containerRect.width : containerRect.height;

      // 2. 鼠标当前距离
      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;

      // 3. 与起始点的差值(px)
      const delta = currentPos - startPosRef.current;

      // 4. 将像素差转换成相对于容器的百分比
      const deltaPercent = (delta / containerSize) * 100;

      // 5. 基于初始 sizes + deltaPercent 来计算新尺寸
      const newSizes = [...initialSizesRef.current];
      const prevSize = newSizes[activeSplitter];
      const nextSize = newSizes[activeSplitter + 1];
      // 如果只有一个分割条的情况，要注意数组越界
      if (activeSplitter + 1 >= newSizes.length) return;

      // 让左(或上) 面板 += deltaPercent
      let updatedPrev = prevSize + deltaPercent;
      // 让右(或下) 面板 -= deltaPercent
      let updatedNext = nextSize - deltaPercent;

      // 6. 应用最小尺寸限制
      const minPrev = minSizes[activeSplitter] ?? 0;
      const minNext = minSizes[activeSplitter + 1] ?? 0;

      // 如果小于最小值，就修正
      if (updatedPrev < minPrev) {
        updatedPrev = minPrev;
        // 保持这两个面板的总和不变
        updatedNext = prevSize + nextSize - updatedPrev;
      }
      if (updatedNext < minNext) {
        updatedNext = minNext;
        // 同理
        updatedPrev = prevSize + nextSize - updatedNext;
      }

      // 更新回 newSizes
      newSizes[activeSplitter] = updatedPrev;
      newSizes[activeSplitter + 1] = updatedNext;
      setSizes(newSizes);
    },
    [isDragging, activeSplitter, containerRef, direction, minSizes],
  );

  // =============== 全局鼠标事件绑定 ===============
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    // 清理函数
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // =============== 渲染 ===============
  return (
    <div
      ref={containerRef}
      className={`flex ${
        direction === "horizontal" ? "flex-row" : "flex-col"
      } w-full h-full`}
    >
      {React.Children.map(children, (child, index) => {
        return (
          <React.Fragment key={index}>
            {/* 子面板 */}
            <div
              className="relative flex-grow overflow-auto"
              style={{ flexBasis: `${sizes[index]}%` }}
            >
              {child}
            </div>

            {/* 分割条（在每个面板之后，除最后一个） */}
            {index < children.length - 1 && (
              <div
                style={{
                  cursor: direction === "horizontal" ? "col-resize" : "row-resize",
                }}
                className={`
                  bg-gray-300 
                  hover:bg-gray-400
                  ${direction === "horizontal" ? "w-1" : "h-1"}
                `}
                onMouseDown={(e) => handleMouseDown(index, e)}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Splitter;
