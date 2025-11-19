import { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";

const CommitGraph = ({ branches }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (!branches || branches.length === 0) return;

    const nodes = [];
    const edges = [];
    const colors = {
      main: "#2ecc71",
      dev: "#3498db",
      feature: "#f39c12",
      bugfix: "#e74c3c",
      other: "#9b59b6",
    };

    const mainBranch =
      branches.find(
        (b) => b.name.toLowerCase() === "main" || b.name.toLowerCase() === "master"
      ) || branches[0];

    const sortedBranches = [
      mainBranch,
      ...branches.filter((b) => b.name !== mainBranch.name),
    ];

    const commitSpacing = 120;

    sortedBranches.forEach((branch, branchIndex) => {
      const color =
        colors[branch.name.toLowerCase()] ||
        (branch.name === mainBranch.name ? colors.main : colors.other);

      const yPosition =
        branch.name === mainBranch.name
          ? 0
          : (branchIndex % 2 === 0 ? 1 : -1) *
            Math.ceil(branchIndex / 2) *
            250;

      branch.commits.forEach((commit, commitIndex) => {
        const nodeId = `${branch.name}-${commit.hash}`;
        const x = commitIndex * commitSpacing;
        const y = yPosition;

        nodes.push({
          id: nodeId,
          label: "",
          title: `
            ${commit.message}
            Commit: ${commit.hash}
            Author: ${commit.author}
            Date: ${commit.date}
            Branch: ${branch.name}
          `,
          color,
          x,
          y,
          shape: "dot",
          size: 14,
          font: { color: "#fff" },
        });

        if (commit.parent) {
          const parentId = `${branch.name}-${commit.parent}`;
          edges.push({
            from: parentId,
            to: nodeId,
            color: { color },
            smooth: { type: "cubicBezier", roundness: 0.4 },
          });
        }
      });

      nodes.push({
        id: `branch-${branch.name}`,
        label: branch.name,
        color,
        shape: "box",
        font: { color: "#fff", size: 14 },
        x: -commitSpacing,
        y: yPosition,
        title: `Branch: ${branch.name}`,
      });

      if (branch.commits.length > 0) {
        edges.push({
          from: `branch-${branch.name}`,
          to: `${branch.name}-${branch.commits[0].hash}`,
          color: { color },
          dashes: true,
        });
      }
    });

    const allCommits = {};
    branches.forEach((b) =>
      b.commits.forEach((c) => {
        allCommits[c.hash] = allCommits[c.hash] || [];
        allCommits[c.hash].push(b.name);
      })
    );

    Object.entries(allCommits).forEach(([hash, branchList]) => {
      if (branchList.length > 1) {
        const [baseBranch, ...mergedFrom] = branchList;
        mergedFrom.forEach((srcBranch) => {
          edges.push({
            from: `${srcBranch}-${hash}`,
            to: `${baseBranch}-${hash}`,
            color: { color: "#fffa65" },
            width: 2,
            dashes: [4, 4],
            arrows: "to",
            title: `🔀 Merged ${srcBranch} → ${baseBranch}`,
          });
        });
      }
    });

    const data = { nodes, edges };

    const options = {
      physics: false,
      layout: { hierarchical: false },
      interaction: {
        hover: true,
        tooltipDelay: 50,
        dragView: true,
        dragNodes: true,
        zoomView: true,
        navigationButtons: true,
        keyboard: true,
      },
      edges: {
        smooth: { type: "curvedCW", roundness: 0.3 },
        width: 2,
      },
      nodes: {
        borderWidth: 1,
        shadow: true,
      },
    };

    const network = new Network(containerRef.current, data, options);

    let lastDistance = null;
    containerRef.current.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length === 2) {
          const dx = event.touches[0].clientX - event.touches[1].clientX;
          const dy = event.touches[0].clientY - event.touches[1].clientY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (lastDistance) {
            const scaleFactor = distance / lastDistance;
            network.moveTo({ scale: network.getScale() * scaleFactor });
          }
          lastDistance = distance;
        }
      },
      { passive: false }
    );

    containerRef.current.addEventListener("touchend", () => {
      lastDistance = null;
    });

    containerRef.current.addEventListener("dblclick", () => {
      network.fit({ animation: true });
    });

    network.on("hoverNode", (params) => {
      const nodeId = params.node;
      const node = nodes.find((n) => n.id === nodeId);
      if (node && !node.id.startsWith("branch-")) {
        network.body.data.nodes.update({
          id: nodeId,
          label: node.title
            .split("<b>")[1]
            ?.split("</b>")[0]
            ?.slice(0, 25) + "...",
        });
      }
    });

    network.on("blurNode", (params) => {
      const nodeId = params.node;
      const node = nodes.find((n) => n.id === nodeId);
      if (node && !node.id.startsWith("branch-")) {
        network.body.data.nodes.update({
          id: nodeId,
          label: "",
        });
      }
    });
  }, [branches]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "575px",
        border: "1px solid #444",
        borderRadius: "8px",
        backgroundColor: "#010409",
        touchAction: "none",
      }}
    />
  );
};

export default CommitGraph;
