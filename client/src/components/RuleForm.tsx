import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '../services';
import { Rule } from '../util/types';

import {
  getRulesByUser,
  addRuleForUser,
  updateRuleForUserById,
  deleteRuleForUserById,
} from '../services/api';

interface Props {
  initialRule: Partial<Rule>;
  onSubmit: (rule: Partial<Rule>) => void;
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
            props.onSubmit(rule);
          }
        });
    } else {
      // If we're adding a new rule, call the add API endpoint
      addRuleForUser(userState.currentUser.id, rule).then(response => {
        if (response.data.status === 'ok') {
          props.onSubmit(rule);
        }
      });
    }

    props.onSubmit(rule);
  };

  return (
    <form className="rule-form" onSubmit={handleFormSubmit}>
      <input
        name="serial"
        value={rule.serial || ''}
        onChange={handleInputChange}
        placeholder="Serial"
      />
      <input
        name="name"
        value={rule.name || ''}
        onChange={handleInputChange}
        placeholder="Name"
      />
      <input
        name="category"
        value={rule.category || ''}
        onChange={handleInputChange}
        placeholder="Category"
      />
      <input
        name="subcategory"
        value={rule.subcategory || ''}
        onChange={handleInputChange}
        placeholder="Subcategory"
      />
      <input
        name="new_name"
        value={rule.new_name || ''}
        onChange={handleInputChange}
        placeholder="New Name"
      />
      <input
        name="new_category"
        value={rule.new_category || ''}
        onChange={handleInputChange}
        placeholder="New Category"
      />
      <input
        name="new_subcategory"
        value={rule.new_subcategory || ''}
        onChange={handleInputChange}
        placeholder="New Subcategory"
      />
      <button type="submit">Add new rule</button>
    </form>
  );
};

export default RuleForm;
