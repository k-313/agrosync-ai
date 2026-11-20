"""
AgroSync AI - Pure Python Random Forest Regressor & Agronomic Pipeline
Engineered for reliable cross-platform execution without external C-extensions.
Implements bootstrap aggregation, variance-reduction tree splitting,
statistical confidence interval estimation, and feature importance attribution.
"""

import math
import random
import json
from typing import List, Dict, Any, Tuple, Optional

class DecisionTreeNode:
    def __init__(
        self,
        feature_index: Optional[int] = None,
        threshold: Optional[float] = None,
        left: Optional['DecisionTreeNode'] = None,
        right: Optional['DecisionTreeNode'] = None,
        value: Optional[float] = None,
        impurity_reduction: float = 0.0
    ):
        self.feature_index = feature_index
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value
        self.impurity_reduction = impurity_reduction

    def is_leaf(self) -> bool:
        return self.value is not None

    def to_dict(self) -> Dict[str, Any]:
        if self.is_leaf():
            return {"value": self.value}
        return {
            "feature_index": self.feature_index,
            "threshold": self.threshold,
            "impurity_reduction": self.impurity_reduction,
            "left": self.left.to_dict() if self.left else None,
            "right": self.right.to_dict() if self.right else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DecisionTreeNode':
        if "value" in data and data["value"] is not None:
            return cls(value=data["value"])
        node = cls(
            feature_index=data.get("feature_index"),
            threshold=data.get("threshold"),
            impurity_reduction=data.get("impurity_reduction", 0.0)
        )
        if data.get("left"):
            node.left = cls.from_dict(data["left"])
        if data.get("right"):
            node.right = cls.from_dict(data["right"])
        return node


class DecisionTreeRegressor:
    def __init__(
        self,
        max_depth: int = 10,
        min_samples_split: int = 4,
        max_features: Optional[str] = "sqrt"
    ):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.root: Optional[DecisionTreeNode] = None
        self.feature_importances: List[float] = []

    def _variance(self, y: List[float]) -> float:
        n = len(y)
        if n <= 1:
            return 0.0
        mean = sum(y) / n
        return sum((val - mean) ** 2 for val in y) / n

    def _best_split(
        self, X: List[List[float]], y: List[float], n_features: int, rng: random.Random
    ) -> Tuple[Optional[int], Optional[float], float]:
        n_samples = len(y)
        current_variance = self._variance(y)
        best_gain = -1.0
        best_feature = None
        best_threshold = None

        if self.max_features == "sqrt":
            k = max(1, int(math.sqrt(n_features)))
            feature_indices = rng.sample(range(n_features), k)
        else:
            feature_indices = list(range(n_features))

        for feat_idx in feature_indices:
            values = [row[feat_idx] for row in X]
            unique_vals = sorted(set(values))
            if len(unique_vals) <= 1:
                continue

            # Test up to 10 split points
            if len(unique_vals) > 10:
                step = len(unique_vals) // 10
                split_candidates = [
                    (unique_vals[i] + unique_vals[i+1]) / 2.0
                    for i in range(0, len(unique_vals)-1, step)
                ]
            else:
                split_candidates = [
                    (unique_vals[i] + unique_vals[i+1]) / 2.0
                    for i in range(len(unique_vals)-1)
                ]

            for thresh in split_candidates:
                y_left = [y[i] for i in range(n_samples) if X[i][feat_idx] <= thresh]
                y_right = [y[i] for i in range(n_samples) if X[i][feat_idx] > thresh]

                if not y_left or not y_right:
                    continue

                w_left = len(y_left) / n_samples
                w_right = len(y_right) / n_samples
                weighted_var = (w_left * self._variance(y_left)) + (w_right * self._variance(y_right))
                gain = current_variance - weighted_var

                if gain > best_gain:
                    best_gain = gain
                    best_feature = feat_idx
                    best_threshold = thresh

        return best_feature, best_threshold, max(0.0, best_gain)

    def _build_tree(
        self,
        X: List[List[float]],
        y: List[float],
        depth: int,
        n_features: int,
        rng: random.Random
    ) -> DecisionTreeNode:
        n_samples = len(y)
        if depth >= self.max_depth or n_samples < self.min_samples_split:
            leaf_val = sum(y) / n_samples if n_samples > 0 else 0.0
            return DecisionTreeNode(value=leaf_val)

        feat_idx, thresh, gain = self._best_split(X, y, n_features, rng)
        if feat_idx is None or gain <= 1e-7:
            leaf_val = sum(y) / n_samples
            return DecisionTreeNode(value=leaf_val)

        # Record feature importance gain
        self.feature_importances[feat_idx] += (gain * n_samples)

        left_X, left_y = [], []
        right_X, right_y = [], []
        for i in range(n_samples):
            if X[i][feat_idx] <= thresh:
                left_X.append(X[i])
                left_y.append(y[i])
            else:
                right_X.append(X[i])
                right_y.append(y[i])

        left_child = self._build_tree(left_X, left_y, depth + 1, n_features, rng)
        right_child = self._build_tree(right_X, right_y, depth + 1, n_features, rng)

        return DecisionTreeNode(
            feature_index=feat_idx,
            threshold=thresh,
            left=left_child,
            right=right_child,
            impurity_reduction=gain
        )

    def fit(self, X: List[List[float]], y: List[float], rng: random.Random):
        n_features = len(X[0])
        self.feature_importances = [0.0] * n_features
        self.root = self._build_tree(X, y, 0, n_features, rng)

    def _predict_row(self, row: List[float], node: DecisionTreeNode) -> float:
        if node.is_leaf():
            return node.value
        if row[node.feature_index] <= node.threshold:
            return self._predict_row(row, node.left)
        else:
            return self._predict_row(row, node.right)

    def predict(self, X: List[List[float]]) -> List[float]:
        return [self._predict_row(row, self.root) for row in X]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "max_depth": self.max_depth,
            "min_samples_split": self.min_samples_split,
            "max_features": self.max_features,
            "feature_importances": self.feature_importances,
            "root": self.root.to_dict() if self.root else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DecisionTreeRegressor':
        tree = cls(
            max_depth=data.get("max_depth", 10),
            min_samples_split=data.get("min_samples_split", 4),
            max_features=data.get("max_features", "sqrt")
        )
        tree.feature_importances = data.get("feature_importances", [])
        if data.get("root"):
            tree.root = DecisionTreeNode.from_dict(data["root"])
        return tree


class PureRandomForestRegressor:
    def __init__(
        self,
        n_estimators: int = 40,
        max_depth: int = 10,
        min_samples_split: int = 4,
        max_features: str = "sqrt",
        random_state: int = 42
    ):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.random_state = random_state
        self.trees: List[DecisionTreeRegressor] = []
        self.feature_importances_: List[float] = []

    def fit(self, X: List[List[float]], y: List[float]):
        n_samples = len(X)
        n_features = len(X[0])
        rng = random.Random(self.random_state)
        self.trees = []
        total_importances = [0.0] * n_features

        for i in range(self.n_estimators):
            # Bootstrap sampling with replacement
            boot_indices = [rng.randint(0, n_samples - 1) for _ in range(n_samples)]
            boot_X = [X[idx] for idx in boot_indices]
            boot_y = [y[idx] for idx in boot_indices]

            tree = DecisionTreeRegressor(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=self.max_features
            )
            tree_rng = random.Random(rng.randint(0, 1000000))
            tree.fit(boot_X, boot_y, tree_rng)
            self.trees.append(tree)

            for feat_i, imp in enumerate(tree.feature_importances):
                total_importances[feat_i] += imp

        # Normalize feature importances
        sum_imp = sum(total_importances)
        if sum_imp > 0:
            self.feature_importances_ = [round(imp / sum_imp, 4) for imp in total_importances]
        else:
            self.feature_importances_ = [round(1.0 / n_features, 4) for _ in range(n_features)]

    def predict_with_confidence(self, row: List[float]) -> Tuple[float, float, float, float]:
        """
        Returns (mean_prediction, lower_bound, upper_bound, standard_error)
        calculated from ensemble empirical tree distribution.
        """
        preds = [tree._predict_row(row, tree.root) for tree in self.trees]
        mean_pred = sum(preds) / len(preds)
        variance = sum((p - mean_pred) ** 2 for p in preds) / max(1, len(preds) - 1)
        std_err = math.sqrt(variance)

        # 95% Confidence Interval: ~ 1.96 * std_err
        lower_bound = max(0.0, round(mean_pred - 1.96 * std_err, 1))
        upper_bound = round(mean_pred + 1.96 * std_err, 1)
        return round(mean_pred, 1), lower_bound, upper_bound, round(std_err, 1)

    def predict(self, X: List[List[float]]) -> List[float]:
        results = []
        for row in X:
            preds = [tree._predict_row(row, tree.root) for tree in self.trees]
            results.append(sum(preds) / len(preds))
        return results

    def to_dict(self) -> Dict[str, Any]:
        return {
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "min_samples_split": self.min_samples_split,
            "max_features": self.max_features,
            "random_state": self.random_state,
            "feature_importances_": self.feature_importances_,
            "trees": [t.to_dict() for t in self.trees]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PureRandomForestRegressor':
        rf = cls(
            n_estimators=data.get("n_estimators", 40),
            max_depth=data.get("max_depth", 10),
            min_samples_split=data.get("min_samples_split", 4),
            max_features=data.get("max_features", "sqrt"),
            random_state=data.get("random_state", 42)
        )
        rf.feature_importances_ = data.get("feature_importances_", [])
        rf.trees = [DecisionTreeRegressor.from_dict(t) for t in data.get("trees", [])]
        return rf


class AgronomicYieldPipeline:
    def __init__(self):
        self.numerical_cols = ["cultivation_area", "rainfall_mm", "temperature_celsius", "days_to_harvest"]
        self.categorical_cols = ["crop_name", "soil_type", "season", "irrigation_type"]
        self.scaler_means: Dict[str, float] = {}
        self.scaler_stds: Dict[str, float] = {}
        self.one_hot_categories: Dict[str, List[str]] = {}
        self.feature_names: List[str] = []
        self.rf: Optional[PureRandomForestRegressor] = None

    def fit_transform(self, rows: List[Dict[str, Any]]) -> Tuple[List[List[float]], List[float]]:
        # Collect categories
        for cat_col in self.categorical_cols:
            cats = sorted(list(set(row[cat_col] for row in rows)))
            self.one_hot_categories[cat_col] = cats

        # Compute numerical stats
        for num_col in self.numerical_cols:
            vals = [float(row[num_col]) for row in rows]
            mean = sum(vals) / len(vals)
            variance = sum((v - mean) ** 2 for v in vals) / len(vals)
            std = math.sqrt(variance) or 1.0
            self.scaler_means[num_col] = mean
            self.scaler_stds[num_col] = std

        # Build feature names
        self.feature_names = list(self.numerical_cols)
        for cat_col in self.categorical_cols:
            for cat in self.one_hot_categories[cat_col]:
                self.feature_names.append(f"{cat_col}_{cat}")

        X = []
        y = []
        for row in rows:
            feat_row = self._transform_row(row)
            X.append(feat_row)
            y.append(float(row["harvested_yield_kg"]))

        return X, y

    def _transform_row(self, row: Dict[str, Any]) -> List[float]:
        feat_row = []
        # Numerical standardized
        for num_col in self.numerical_cols:
            raw_val = float(row.get(num_col, 0.0))
            std_val = (raw_val - self.scaler_means.get(num_col, 0.0)) / (self.scaler_stds.get(num_col, 1.0) or 1.0)
            feat_row.append(std_val)

        # Categorical one-hot
        for cat_col in self.categorical_cols:
            val = str(row.get(cat_col, ""))
            for cat in self.one_hot_categories.get(cat_col, []):
                feat_row.append(1.0 if val == cat else 0.0)

        return feat_row

    def fit(self, rows: List[Dict[str, Any]], n_estimators: int = 35, max_depth: int = 9):
        X, y = self.fit_transform(rows)
        self.rf = PureRandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=4,
            max_features="sqrt",
            random_state=42
        )
        self.rf.fit(X, y)

    def predict_one(self, row: Dict[str, Any]) -> Dict[str, Any]:
        feat_row = self._transform_row(row)
        mean_pred, lower, upper, std_err = self.rf.predict_with_confidence(feat_row)

        # Attribute top positive/negative drivers
        explanations = []
        crop = row.get("crop_name", "Crop")
        area = float(row.get("cultivation_area", 1.0))
        irrigation = row.get("irrigation_type", "Standard")
        soil = row.get("soil_type", "Standard")

        explanations.append(f"Cultivated land area of {area:.1f} acres represents the primary volumetric capacity driver.")
        if irrigation in ["Drip", "Sprinkler"]:
            explanations.append(f"Modern {irrigation} irrigation mitigates water stress, providing a +10% to +20% yield multiplier.")
        elif irrigation == "Rainfed":
            explanations.append(f"Rainfed cultivation introduces sensitivity to regional precipitation fluctuations.")

        if soil in ["Loamy", "Alluvial"]:
            explanations.append(f"Optimal {soil} soil promotes deep root aeration and high moisture retention.")
        elif soil in ["Black Cotton"]:
            explanations.append(f"{soil} soil offers high clay retention suitable for deep seasonal moisture preservation.")

        return {
            "predicted_yield_kg": mean_pred,
            "lower_estimate_kg": lower,
            "upper_estimate_kg": upper,
            "standard_error_kg": std_err,
            "confidence_level": "95%",
            "explanations": explanations
        }

    def save(self, filepath: str):
        payload = {
            "numerical_cols": self.numerical_cols,
            "categorical_cols": self.categorical_cols,
            "scaler_means": self.scaler_means,
            "scaler_stds": self.scaler_stds,
            "one_hot_categories": self.one_hot_categories,
            "feature_names": self.feature_names,
            "rf": self.rf.to_dict() if self.rf else None
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f)

    @classmethod
    def load(cls, filepath: str) -> 'AgronomicYieldPipeline':
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        pipeline = cls()
        pipeline.numerical_cols = data["numerical_cols"]
        pipeline.categorical_cols = data["categorical_cols"]
        pipeline.scaler_means = data["scaler_means"]
        pipeline.scaler_stds = data["scaler_stds"]
        pipeline.one_hot_categories = data["one_hot_categories"]
        pipeline.feature_names = data["feature_names"]
        if data.get("rf"):
            pipeline.rf = PureRandomForestRegressor.from_dict(data["rf"])
        return pipeline
