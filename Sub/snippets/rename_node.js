function rename(node) {
   const host = node.Hostname;
   if (host.includes("jiedian")) {
      return node.Remark + "_Cheap";
   }
   if (host.includes("incomparablebeauty")) {
      return node.Remark + "_Candy";
   }
  return node.Remark;
}