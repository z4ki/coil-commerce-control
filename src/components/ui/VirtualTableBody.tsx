import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface VirtualTableBodyProps<T> {
  rows: T[];
  rowHeight: number;
  children: (row: T, index: number, style: React.CSSProperties) => React.ReactNode;
}

export function VirtualTableBody<T>({ rows, rowHeight, children }: VirtualTableBodyProps<T>) {
  // Render <tr> elements inside <tbody> using react-window
  return (
    <tbody>
      <FixedSizeList
        height={400}
        itemCount={rows.length}
        itemSize={rowHeight}
        width="100%"
        outerElementType={React.forwardRef<HTMLTableSectionElement, React.HTMLProps<HTMLTableSectionElement>>((props, ref) => <tbody ref={ref} {...props} />)}
        innerElementType={React.forwardRef<HTMLTableSectionElement, React.HTMLProps<HTMLTableSectionElement>>((props, ref) => <>{props.children}</>)}
      >
        {({ index, style }) => children(rows[index], index, style)}
      </FixedSizeList>
    </tbody>
  );
} 