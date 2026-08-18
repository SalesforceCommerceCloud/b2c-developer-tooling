---
'@salesforce/mrt-utilities': minor
---

Make DataStore.getEntry shard-aware. When the MRT_NUM_SHARDS environment variable is set to a value greater than 1, reads are spread across shard partitions by selecting a random shard, relieving read pressure on a single hot partition. When MRT_NUM_SHARDS is unset or 1, behavior is unchanged. The getEntry signature and return shape are unchanged, so this is backward compatible.
