import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '../services';
import { Rule } from '../util/types';

import { addRuleForUser, updateRuleForUserById } from '../services/api';

interface Props {
  initialRule: Partial<Rule>;
  onSubmit?: (rule: Partial<Rule>) => void;
  onCancel?: () => void;
}

const RuleForm = (props: Props) => {
  const { userState } = useCurrentUser();
  const [rule, setRule] = useState(props.initialRule);

  useEffect(() => {
    setRule(props.initialRule);
  }, [props.initialRule]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setRule({ ...rule, [name]: value });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rule.id) {
      // If we're editing an existing rule, call the update API endpoint
      updateRuleForUserById(userState.currentUser.id, rule.id, rule)
        .then()
        .then(response => {
          if (response.data.status === 'ok') {
            if (props.onSubmit) props.onSubmit(rule);
          }
        });
    } else {
      // If we're adding a new rule, call the add API endpoint
      addRuleForUser(userState.currentUser.id, rule).then(response => {
        if (response.data.status === 'ok') {
          if (props.onSubmit) props.onSubmit(rule);
        }
      });
    }
  };

  const onCancelClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    if (props.onCancel) props.onCancel();
  };

  return (
    <form className="rule-form" onSubmit={handleFormSubmit}>
      <div className="serial-row">
        <label htmlFor="serial">Serial</label>
        <input
          className="serial-input"
          id="serial"
          name="serial"
          type="number"
          value={rule.serial || ''}
          onChange={handleInputChange}
          placeholder="Serial"
        />
      </div>
      <div className="form-row">
        <div className="input-group details">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            value={rule.name || ''}
            onChange={handleInputChange}
            placeholder="Name"
          />
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            value={rule.category || ''}
            onChange={handleInputChange}
            placeholder="Category"
          />
          <label htmlFor="subcategory">Subcategory</label>
          <input
            id="subcategory"
            name="subcategory"
            value={rule.subcategory || ''}
            onChange={handleInputChange}
            placeholder="Subcategory"
          />
        </div>

        <div className="conversion-sign">{'=>'}</div>

        <div className="input-group new-details">
          <label htmlFor="new_name">New Name</label>
          <input
            id="new_name"
            name="new_name"
            value={rule.new_name || ''}
            onChange={handleInputChange}
            placeholder="New Name"
          />
          <label htmlFor="new_category">New Category</label>
          <input
            id="new_category"
            name="new_category"
            value={rule.new_category || ''}
            onChange={handleInputChange}
            placeholder="New Category"
          />
          <label htmlFor="new_subcategory">New Subcategory</label>
          <input
            id="new_subcategory"
            name="new_subcategory"
            value={rule.new_subcategory || ''}
            onChange={handleInputChange}
            placeholder="New Subcategory"
          />
        </div>
      </div>

      <div className="button-row">
        <button type="button" onClick={onCancelClick}>
          Cancel
        </button>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
};

export default RuleForm;
