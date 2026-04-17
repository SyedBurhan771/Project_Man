import customersRaw from './customers.json'
import sitesRaw from './sites.json'

const normalize = (v) => String(v ?? '').trim()

export function getCustomerDropdownOptions() {
  return customersRaw
    .filter((c) => normalize(c.Customer_Code))
    .map((c) => ({
      id: normalize(c.Customer_Code),
      label: `${normalize(c.Customer_Code)} - ${normalize(c.Customer_Name)}`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function getSiteDropdownOptions() {
  return sitesRaw
    .filter((s) => normalize(s.Site_Code))
    .map((s) => ({
      id: normalize(s.Site_Code),
      label: `${normalize(s.Site_Code)} - ${normalize(s.Site_Name)}`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}
