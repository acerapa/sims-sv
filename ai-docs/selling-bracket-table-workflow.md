# Selling Bracket Table: Unified Form Workflow & Change Tracking

This document describes the recommended workflow for managing the Selling Bracket table in the RamTech Settings Dashboard, focusing on a unified form approach and robust change tracking for additions, edits, and deletions.

---

## Overview

The Selling Bracket table allows users to configure markup percentages based on product cost ranges. To streamline user experience and data integrity, all changes (add, edit, delete) are managed in a single editable table with a **"Save Changes"** button. This approach ensures that all modifications are submitted together, reducing the risk of inconsistent state.

---

## Data Structure

Use a unified data structure for all brackets (existing and new):

```typescript
type SellingBracket = {
  id?: number; // Present for existing brackets, undefined for new
  lowerLimit: number;
  upperLimit: number;
  markupPercentage: number;
  _deleted?: boolean; // Marked true if the bracket is to be deleted
  _new?: boolean;     // Marked true if the bracket is newly added
  _original?: {       // Stores original values for edit detection
    lowerLimit: number;
    upperLimit: number;
    markupPercentage: number;
  };
};
```

---

## Workflow Steps

### 1. **Initialization**

- On page load, clone the original brackets into a local, editable array.
- For each bracket, store its original values in an `_original` property.

### 2. **Editing**

- All rows (existing and new) are editable directly in the table.
- Use Svelte's two-way binding or input events to update values in `editableBrackets`.

### 3. **Adding Brackets**

- When the user clicks "Add Bracket," push a new object with `_new: true` to the array.

### 4. **Deleting Brackets**

- When the user clicks "Delete," set `_deleted: true` on the bracket.
- Optionally, hide deleted rows from the UI.

### 5. **Change Detection**

- **New Brackets:** Identified by `_new: true`.
- **Deleted Brackets:** Identified by `_deleted: true`.
- **Edited Brackets:**  
  Use a comparison function to check if any field differs from `_original`:

  ```typescript
  function isEdited(bracket: SellingBracket) {
    if (bracket._new || !bracket._original) return false;
    return (
      bracket.lowerLimit !== bracket._original.lowerLimit ||
      bracket.upperLimit !== bracket._original.upperLimit ||
      bracket.markupPercentage !== bracket._original.markupPercentage
    );
  }
  ```

### 6. **Form Submission**

- Wrap the table in a `<form>` element.
- Use array-style input names (e.g., `brackets[0][lowerLimit]`) for all fields.
- Include hidden inputs for `_new` and `_deleted` flags.
- On submit, the server receives the full array of brackets and processes additions, edits, and deletions accordingly.

---

## Example Svelte Table Row

```svelte
{#each editableBrackets as bracket, ndx}
  {#if !bracket._deleted}
    <tr>
      <td>
        <input type="hidden" name={`brackets[${ndx}][id]`} value={bracket.id} />
        BRACKET-{bracket.id ?? 'NEW'}
      </td>
      <td>
        <input type="number" name={`brackets[${ndx}][lowerLimit]`} bind:value={bracket.lowerLimit} />
      </td>
      <td>
        <input type="number" name={`brackets[${ndx}][upperLimit]`} bind:value={bracket.upperLimit} />
      </td>
      <td>
        <input type="number" name={`brackets[${ndx}][markupPercentage]`} bind:value={bracket.markupPercentage} />
      </td>
      <td>
        <button type="button" on:click={() => bracket._deleted = true}>Delete</button>
        <input type="hidden" name={`brackets[${ndx}][_new]`} value={bracket._new ? '1' : ''} />
        <input type="hidden" name={`brackets[${ndx}][_deleted]`} value={bracket._deleted ? '1' : ''} />
      </td>
    </tr>
  {/if}
{/each}
```

---

## Server-Side Handling

On form submission, the server receives an array of bracket objects. The server should:

- **Create** new brackets where `_new` is true.
- **Update** existing brackets where values differ from their originals (if originals are sent, or by comparing with the database).
- **Delete** brackets where `_deleted` is true.

---

## Benefits

- **Atomic updates:** All changes are submitted together, reducing errors.
- **User-friendly:** One "Save Changes" button for all actions.
- **Accurate change tracking:** Only actual changes are processed.
- **Extensible:** Easy to add undo/cancel functionality by resetting the local array.

---

## Tips

- Always keep a copy of the original data for accurate edit detection.
- Use hidden fields for flags to ensure all necessary data is submitted.
- Validate input on both client and server sides for data integrity.

---

**This workflow ensures a robust, maintainable, and user-friendly experience for managing selling brackets in your application.**