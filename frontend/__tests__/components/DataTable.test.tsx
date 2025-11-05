/**
 * DataTable Component Test Suite
 * Tests for the DataTable component with sorting, filtering, and pagination
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

interface TestData {
  id: string
  name: string
  email: string
  status: string
  amount: number
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', amount: 100 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', amount: 200 },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active', amount: 150 },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', status: 'active', amount: 300 },
  { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com', status: 'inactive', amount: 250 }
]

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    accessorKey: 'amount',
    header: 'Amount'
  }
]

describe('DataTable Component', () => {
  describe('Rendering', () => {
    it('should render table with data', () => {
      render(<DataTable columns={columns} data={mockData} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('should render all columns', () => {
      render(<DataTable columns={columns} data={mockData} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
    })

    it('should render all rows', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const rows = screen.getAllByRole('row')
      // +1 for header row
      expect(rows).toHaveLength(mockData.length + 1)
    })

    it('should render empty state when no data', () => {
      render(<DataTable columns={columns} data={[]} />)

      expect(screen.getByText(/no results/i)).toBeInTheDocument()
    })

    it('should render custom empty message', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          emptyMessage="No users found"
        />
      )

      expect(screen.getByText('No users found')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort by name ascending', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const nameHeader = screen.getByText('Name')
      fireEvent.click(nameHeader)

      const rows = screen.getAllByRole('row')
      const firstRow = rows[1]
      expect(within(firstRow).getByText('Alice Brown')).toBeInTheDocument()
    })

    it('should sort by name descending', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const nameHeader = screen.getByText('Name')
      fireEvent.click(nameHeader)
      fireEvent.click(nameHeader)

      const rows = screen.getAllByRole('row')
      const firstRow = rows[1]
      expect(within(firstRow).getByText('John Doe')).toBeInTheDocument()
    })

    it('should sort by amount', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const amountHeader = screen.getByText('Amount')
      fireEvent.click(amountHeader)

      const rows = screen.getAllByRole('row')
      const firstRow = rows[1]
      expect(within(firstRow).getByText('100')).toBeInTheDocument()
    })

    it('should toggle sort direction', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const nameHeader = screen.getByText('Name')

      // First click: ascending
      fireEvent.click(nameHeader)
      let rows = screen.getAllByRole('row')
      expect(within(rows[1]).getByText('Alice Brown')).toBeInTheDocument()

      // Second click: descending
      fireEvent.click(nameHeader)
      rows = screen.getAllByRole('row')
      expect(within(rows[1]).getByText('John Doe')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('should filter by name', () => {
      render(<DataTable columns={columns} data={mockData} filterColumn="name" />)

      const filterInput = screen.getByPlaceholderText(/filter/i)
      fireEvent.change(filterInput, { target: { value: 'John' } })

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should filter case-insensitively', () => {
      render(<DataTable columns={columns} data={mockData} filterColumn="name" />)

      const filterInput = screen.getByPlaceholderText(/filter/i)
      fireEvent.change(filterInput, { target: { value: 'john' } })

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('should show no results when filter matches nothing', () => {
      render(<DataTable columns={columns} data={mockData} filterColumn="name" />)

      const filterInput = screen.getByPlaceholderText(/filter/i)
      fireEvent.change(filterInput, { target: { value: 'XYZ' } })

      expect(screen.getByText(/no results/i)).toBeInTheDocument()
    })

    it('should clear filter', () => {
      render(<DataTable columns={columns} data={mockData} filterColumn="name" />)

      const filterInput = screen.getByPlaceholderText(/filter/i) as HTMLInputElement
      fireEvent.change(filterInput, { target: { value: 'John' } })
      fireEvent.change(filterInput, { target: { value: '' } })

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls', () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      expect(screen.getByText(/previous/i)).toBeInTheDocument()
      expect(screen.getByText(/next/i)).toBeInTheDocument()
    })

    it('should paginate data', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      const rows = screen.getAllByRole('row')
      // 10 data rows + 1 header row
      expect(rows).toHaveLength(11)
    })

    it('should navigate to next page', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      const nextButton = screen.getByText(/next/i)
      fireEvent.click(nextButton)

      expect(screen.getByText('User 10')).toBeInTheDocument()
    })

    it('should navigate to previous page', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      const nextButton = screen.getByText(/next/i)
      fireEvent.click(nextButton)

      const previousButton = screen.getByText(/previous/i)
      fireEvent.click(previousButton)

      expect(screen.getByText('User 0')).toBeInTheDocument()
    })

    it('should disable previous on first page', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      const previousButton = screen.getByText(/previous/i)
      expect(previousButton).toBeDisabled()
    })

    it('should disable next on last page', () => {
      const largeData = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      const nextButton = screen.getByText(/next/i)
      fireEvent.click(nextButton)

      expect(nextButton).toBeDisabled()
    })

    it('should show page count', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      render(<DataTable columns={columns} data={largeData} pageSize={10} />)

      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    })
  })

  describe('Row Selection', () => {
    it('should select a row', () => {
      const onRowSelect = vi.fn()
      render(
        <DataTable
          columns={columns}
          data={mockData}
          onRowSelect={onRowSelect}
          enableRowSelection
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1]) // First data row

      expect(onRowSelect).toHaveBeenCalled()
    })

    it('should select all rows', () => {
      const onRowSelect = vi.fn()
      render(
        <DataTable
          columns={columns}
          data={mockData}
          onRowSelect={onRowSelect}
          enableRowSelection
        />
      )

      const headerCheckbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(headerCheckbox)

      expect(onRowSelect).toHaveBeenCalled()
    })

    it('should deselect a row', () => {
      const onRowSelect = vi.fn()
      render(
        <DataTable
          columns={columns}
          data={mockData}
          onRowSelect={onRowSelect}
          enableRowSelection
        />
      )

      const checkbox = screen.getAllByRole('checkbox')[1]
      fireEvent.click(checkbox)
      fireEvent.click(checkbox)

      expect(onRowSelect).toHaveBeenCalledTimes(2)
    })
  })

  describe('Custom Columns', () => {
    it('should render custom cell content', () => {
      const customColumns: ColumnDef<TestData>[] = [
        {
          accessorKey: 'name',
          header: 'Name',
          cell: ({ row }) => <strong>{row.original.name}</strong>
        }
      ]

      render(<DataTable columns={customColumns} data={mockData} />)

      const strongElements = screen.getAllByText(/John Doe|Jane Smith/i)
      expect(strongElements[0].tagName).toBe('STRONG')
    })

    it('should render custom header content', () => {
      const customColumns: ColumnDef<TestData>[] = [
        {
          accessorKey: 'name',
          header: () => <span className="custom-header">Full Name</span>
        }
      ]

      render(<DataTable columns={customColumns} data={mockData} />)

      expect(screen.getByText('Full Name')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton', () => {
      render(<DataTable columns={columns} data={[]} loading />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should hide data when loading', () => {
      render(<DataTable columns={columns} data={mockData} loading />)

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have table role', () => {
      render(<DataTable columns={columns} data={mockData} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have sortable column headers', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      render(<DataTable columns={columns} data={mockData} />)

      const nameHeader = screen.getByText('Name')
      nameHeader.focus()
      expect(nameHeader).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty columns', () => {
      render(<DataTable columns={[]} data={mockData} />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should handle single row', () => {
      render(<DataTable columns={columns} data={[mockData[0]]} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should handle special characters in data', () => {
      const specialData = [
        { id: '1', name: 'John & Jane', email: 'test@example.com', status: 'active', amount: 100 }
      ]

      render(<DataTable columns={columns} data={specialData} />)

      expect(screen.getByText('John & Jane')).toBeInTheDocument()
    })

    it('should handle null values', () => {
      const nullData = [
        { id: '1', name: 'John', email: null as any, status: 'active', amount: 100 }
      ]

      render(<DataTable columns={columns} data={nullData} />)

      expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('should handle very long text', () => {
      const longData = [
        {
          id: '1',
          name: 'A'.repeat(100),
          email: 'test@example.com',
          status: 'active',
          amount: 100
        }
      ]

      render(<DataTable columns={columns} data={longData} />)

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        amount: i * 10
      }))

      const { container } = render(
        <DataTable columns={columns} data={largeData} pageSize={10} />
      )

      expect(container).toBeInTheDocument()
    })
  })
})
