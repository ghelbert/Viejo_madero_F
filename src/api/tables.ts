import { request } from "./http";
import type { Table, TableDetail } from "./types";
 
export const tablesApi = {
  tables: () => request<Table[]>("/tables"),
  tableDetail: (id: number) => request<TableDetail>(`/tables/${id}/detail`),
};
 