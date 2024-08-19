function rename(node) {
     const host = node.Hostname;
     if (host.contains("jiedian")) {
        return node.Remark + "_Cheap";
     }
     if (host.contains("incomparablebeauty")) {
        return node.Remark + "_Candy";
     }
    return node.Remark;
}