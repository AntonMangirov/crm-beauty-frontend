import { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { Search, Clear, FilterList } from "@mui/icons-material";

interface ServicesFilterProps {
  onSearch: (query: string) => void;
  onFilter: (isActive: boolean | undefined) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function ServicesFilter({
  onSearch,
  onFilter,
  onClear,
  isLoading = false,
}: ServicesFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (value: boolean | undefined) => {
    setActiveFilter(value);
    onFilter(value);
  };

  const handleClear = () => {
    setSearchQuery("");
    setActiveFilter(undefined);
    onClear();
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || activeFilter !== undefined;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        spacing={2}
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
      >
        {/* Поиск */}
        <TextField
          label="Поиск услуг"
          placeholder="Введите название или описание..."
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={isLoading}
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />

        {/* Фильтр по статусу */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={activeFilter === undefined ? "" : activeFilter}
            label="Статус"
            onChange={(e) =>
              handleFilterChange(
                e.target.value === "" ? undefined : (e.target.value as boolean)
              )
            }
            disabled={isLoading}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value={true}>Активные</MenuItem>
            <MenuItem value={false}>Неактивные</MenuItem>
          </Select>
        </FormControl>

        {/* Кнопка очистки */}
        {hasActiveFilters && (
          <Button
            startIcon={<Clear />}
            onClick={handleClear}
            disabled={isLoading}
            variant="outlined"
            color="secondary"
          >
            Очистить
          </Button>
        )}
      </Stack>

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            icon={<Search />}
            label={`Поиск: "${searchQuery}"`}
            onDelete={() => {
              setSearchQuery("");
              onSearch("");
            }}
            color="primary"
            variant="outlined"
          />
          {activeFilter !== undefined && (
            <Chip
              icon={<FilterList />}
              label={`Статус: ${activeFilter ? "Активные" : "Неактивные"}`}
              onDelete={() => {
                setActiveFilter(undefined);
                onFilter(undefined);
              }}
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
}
