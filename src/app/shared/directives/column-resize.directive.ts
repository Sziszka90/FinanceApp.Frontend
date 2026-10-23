import { Directive, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: 'th[appColumnResize]',
  standalone: true
})
export class ColumnResizeDirective implements OnInit, OnDestroy {
  private resizing = false;
  private pointerId: number | null = null;
  private startX = 0;
  private startWidth = 0;
  private columnIndex = -1;
  private columnWidths: number[] = [];
  private columnCells: HTMLTableCellElement[] = [];
  private readonly captureSortClick = (event: MouseEvent): void => {
    const header = this.elementRef.nativeElement;
    if (!header.hasAttribute('mat-sort-header')) return;

    const target = event.target;
    const clickedArrow = target instanceof Element && target.closest('.mat-sort-header-arrow');
    if (clickedArrow) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  };

  constructor(
    private readonly elementRef: ElementRef<HTMLTableCellElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.elementRef.nativeElement.addEventListener('click', this.captureSortClick, true);
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('click', this.captureSortClick, true);
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    const header = this.elementRef.nativeElement;
    const bounds = header.getBoundingClientRect();
    if (bounds.right - event.clientX > 12) return;

    const table = header.closest('table');
    const headerRow = header.parentElement;
    if (!table || !headerRow) return;

    const columnIndex = Array.from(headerRow.children).indexOf(header);
    const headerCells = Array.from(headerRow.children) as HTMLTableCellElement[];
    const initialWidths = headerCells.map(cell => cell.getBoundingClientRect().width);
    const initialTableWidth = initialWidths.reduce((sum, width) => sum + width, 0);
    const rows = Array.from(table.rows);
    this.columnCells = rows
      .map(row => row.cells.item(columnIndex))
      .filter((cell): cell is HTMLTableCellElement => cell !== null);

    if (!this.columnCells.length) return;

    this.renderer.setStyle(table, 'table-layout', 'fixed');
    this.renderer.setStyle(table, 'min-width', '0');
    this.renderer.setStyle(table, 'width', `${initialTableWidth}px`);
    rows.forEach(row => {
      Array.from(row.cells).forEach((cell, index) => {
        const width = initialWidths[index] ?? cell.getBoundingClientRect().width;
        this.renderer.setStyle(cell, 'width', `${width}px`);
        this.renderer.setStyle(cell, 'min-width', `${width}px`);
      });
    });

    event.preventDefault();
    event.stopPropagation();
    this.resizing = true;
    this.pointerId = event.pointerId;
    this.columnIndex = columnIndex;
    this.columnWidths = [...initialWidths];
    this.startX = event.clientX;
    this.startWidth = initialWidths[columnIndex];
    this.elementRef.nativeElement.setPointerCapture(event.pointerId);
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.resizing || event.pointerId !== this.pointerId) return;

    const delta = event.clientX - this.startX;
    const width = Math.max(64, this.startWidth + delta);
    this.columnWidths[this.columnIndex] = width;
    this.columnCells.forEach(cell => {
      this.renderer.setStyle(cell, 'width', `${width}px`);
      this.renderer.setStyle(cell, 'min-width', `${width}px`);
    });

    const table = this.elementRef.nativeElement.closest('table');
    if (table) {
      const tableWidth = this.columnWidths.reduce((sum, value) => sum + value, 0);
      this.renderer.setStyle(table, 'width', `${tableWidth}px`);
    }
  }

  @HostListener('document:pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    this.endResize(event);
  }

  @HostListener('document:pointercancel', ['$event'])
  onPointerCancel(event: PointerEvent): void {
    this.endResize(event);
  }

  private endResize(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.resizing = false;
    this.pointerId = null;
    this.columnIndex = -1;
    this.columnWidths = [];
  }
}
